import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Cataloging, ICatalogingDocument } from '@/models/Cataloging';
import { Patron, IPatronDocument } from '@/models/Patron';
import { Library, ILibraryDocument } from '@/models/Library';
import { MonthlyActivity } from '@/models/MonthlyActivity';
import { SystemSetting } from '@/models/SystemSetting';
import { Hold } from '@/models/Hold';

export interface CheckoutValidationResult {
  eligible: boolean;
  error?: string;
  patron?: IPatronDocument;
  book?: ICatalogingDocument;
}

export interface CheckoutResult {
  success: boolean;
  error?: string;
  loan?: ILibraryDocument;
  patron?: IPatronDocument;
  book?: ICatalogingDocument;
  dueDate?: Date;
  pointsAwarded?: number;
  eventTitle?: string;
}

export interface CheckInResult {
  success: boolean;
  error?: string;
  patron?: IPatronDocument;
  book?: ICatalogingDocument;
  returnDate?: Date;
  pointsAwarded?: number;
  daysLate?: number;
  holdNotice?: {
    holdId: string;
    patronBarcode: string;
    patronName: string;
  } | null;
}

export interface RenewalResult {
  success: boolean;
  error?: string;
  newDueDate?: Date;
  renewalsCount?: number;
}

export interface ActiveLoanDTO {
  id: string;
  bookId: string;
  bookBarcode: string;
  bookTitle: string;
  bookCover?: string;
  shelfLocation?: string;
  patronId: string;
  patronBarcode: string;
  patronName: string;
  patronPhoto?: string;
  patronClass?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  renewalsCount: number;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  isOverdue: boolean;
  overdueDays: number;
  eventTitle?: string;
  pointsAwarded?: number;
}

export function getBookTitleString(book: unknown): string {
  if (!book) return 'Untitled Book';
  const b = book as { title?: string | { mainTitle?: string } };
  if (typeof b.title === 'string') return b.title;
  if (b.title && typeof b.title === 'object' && b.title.mainTitle) return b.title.mainTitle;
  return 'Untitled Book';
}

/**
 * Validates whether a patron and book are eligible for a new book checkout.
 */
export async function validateCheckoutEligibility(
  patronBarcode: string,
  bookBarcode: string
): Promise<CheckoutValidationResult> {
  await connectDB();

  // 0. Check Global Emergency Circulation Lock
  const setting = await SystemSetting.findById('default');
  if (setting?.emergencyCirculationLock) {
    const reason = setting.circulationLockReason || 'Emergency circulation lock is currently active across the library system.';
    return {
      eligible: false,
      error: `Circulation Paused: ${reason}`,
    };
  }

  const cleanPatronBarcode = patronBarcode.trim();
  const cleanBookBarcode = bookBarcode.trim();

  // 1. Fetch Patron
  const patron = await Patron.findOne({
    barcode: cleanPatronBarcode,
    isDeleted: { $ne: true },
  });

  if (!patron) {
    return { eligible: false, error: `Patron with barcode "${cleanPatronBarcode}" was not found.` };
  }

  if (!patron.active) {
    return { eligible: false, error: `Patron account (${patron.firstname} ${patron.surname}) is currently inactive.` };
  }

  // 2. Validate Passport Photo On File
  const hasPhoto = Boolean(patron.image_url?.secure_url || patron.image_url?.public_id);
  if (!hasPhoto) {
    return {
      eligible: false,
      error: `Patron (${patron.firstname} ${patron.surname}) does not have a valid passport photo on file. Registration photo required before borrowing books.`,
      patron,
    };
  }

  // 3. Strict 1-Book Loan Rule
  if (patron.hasBorrowedBook) {
    const currentBookTitle = patron.lastBorrowedItem?.itemTitle || 'an active book';
    return {
      eligible: false,
      error: `Patron already has an active loan for "${currentBookTitle}". Maximum 1 book borrowed at a time. The active book must be checked in first.`,
      patron,
    };
  }

  // 4. Monthly Borrowing Quota (Max 4 books per calendar month strictly for students)
  if (patron.patronType === 'student') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthlyLoansCount = await Library.countDocuments({
      patronId: patron._id,
      issueDate: { $gte: startOfMonth, $lt: endOfMonth },
      status: { $in: ['borrowed', 'returned', 'overdue'] },
    });

    if (monthlyLoansCount >= 4) {
      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      return {
        eligible: false,
        error: `Monthly loan limit reached: Students are permitted a maximum of 4 book loans per calendar month. Patron has already borrowed ${monthlyLoansCount} books in ${monthName}.`,
        patron,
      };
    }
  }

  // 5. Fetch Catalog Book
  const book = await Cataloging.findOne({ barcode: cleanBookBarcode });

  if (!book) {
    return { eligible: false, error: `Book with barcode "${cleanBookBarcode}" was not found in catalog.`, patron };
  }

  if (book.isCheckedOut) {
    const borrowerName = book.lastBorrowedBy?.patronName || 'another patron';
    return {
      eligible: false,
      error: `Book "${getBookTitleString(book)}" is currently checked out to ${borrowerName}.`,
      patron,
      book,
    };
  }

  if ((book.copiesAvailable ?? 1) <= 0) {
    return {
      eligible: false,
      error: `No copies of "${getBookTitleString(book)}" are currently available on the shelves.`,
      patron,
      book,
    };
  }

  return { eligible: true, patron, book };
}

/**
 * Executes an atomic book checkout.
 */
export async function executeCheckout({
  patronBarcode,
  bookBarcode,
  dueDays = 2,
  eventTitle,
  issuedByUserId,
}: {
  patronBarcode: string;
  bookBarcode: string;
  dueDays?: number;
  eventTitle?: string;
  issuedByUserId?: string;
}): Promise<CheckoutResult> {
  await connectDB();

  const validation = await validateCheckoutEligibility(patronBarcode, bookBarcode);
  if (!validation.eligible || !validation.patron || !validation.book) {
    return { success: false, error: validation.error || 'Checkout validation failed.' };
  }

  const { patron, book } = validation;
  const now = new Date();
  const effectiveDueDays = Math.max(1, dueDays || 2);
  const dueDate = new Date(now.getTime() + effectiveDueDays * 24 * 60 * 60 * 1000);

  const patronFullName = `${patron.firstname} ${patron.surname}`.trim();
  const issuedByObjectId =
    issuedByUserId && mongoose.Types.ObjectId.isValid(issuedByUserId)
      ? new mongoose.Types.ObjectId(issuedByUserId)
      : undefined;

  // 1. Update Cataloging
  book.isCheckedOut = true;
  book.checkedOutBy = patron._id;
  book.checkedOutAt = now;
  book.copiesAvailable = Math.max(0, (book.copiesAvailable ?? 1) - 1);
  book.lastBorrowedBy = {
    patronId: patron._id,
    patronBarcode: patron.barcode,
    patronName: patronFullName,
    checkedOutAt: now,
    dueDate,
  };
  book.patronsCheckedOutHistory = book.patronsCheckedOutHistory || [];
  book.patronsCheckedOutHistory.push({
    checkedOutBy: patron._id,
    checkedOutAt: now,
    dueDate,
  });
  await book.save();

  // 2. Update Patron (no points on checkout; points earned on timely return)
  const bookTitleStr = getBookTitleString(book);
  patron.hasBorrowedBook = true;
  patron.lastBorrowedItem = {
    itemId: book._id,
    itemTitle: bookTitleStr,
    itemBarcode: book.barcode,
    checkoutDate: now,
    dueDate,
  };
  await patron.save();

  // 3. Create Library Circulation Record
  const cleanEventTitle = eventTitle?.trim() || undefined;
  const loan = await Library.create({
    patronId: patron._id,
    patronBarcode: patron.barcode,
    bookId: book._id,
    bookBarcode: book.barcode,
    bookTitle: bookTitleStr,
    issueDate: now,
    dueDate,
    status: 'borrowed',
    renewalsCount: 0,
    eventTitle: cleanEventTitle,
    pointsAwarded: 0,
    issuedBy: issuedByObjectId,
  });

  // 4. Upsert MonthlyActivity (record checkout count without awarding points yet)
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  await MonthlyActivity.findOneAndUpdate(
    {
      patronId: patron._id,
      year: currentYear,
      month: currentMonth,
    },
    {
      $setOnInsert: {
        patronId: patron._id,
        patronBarcode: patron.barcode,
        patronName: patronFullName,
        year: currentYear,
        month: currentMonth,
        monthYear,
        library: 'AAoJ',
        isActive: true,
      },
      $inc: {
        booksCheckedOut: 1,
      },
    },
    { upsert: true, new: true }
  );

  // 5. If this patron had an active hold on this book, fulfill it
  await Hold.updateMany(
    {
      bookBarcode: book.barcode,
      patronBarcode: patron.barcode,
      status: { $in: ['waiting', 'ready'] },
    },
    {
      $set: {
        status: 'fulfilled',
        fulfilledAt: now,
      },
    }
  );

  return {
    success: true,
    loan,
    patron,
    book,
    dueDate,
    pointsAwarded: 0,
    eventTitle: cleanEventTitle,
  };
}

/**
 * Executes an atomic book return (check-in).
 */
export async function executeCheckIn({
  bookBarcode,
  patronBarcode,
  receivedByUserId,
}: {
  bookBarcode?: string;
  patronBarcode?: string;
  receivedByUserId?: string;
}): Promise<CheckInResult> {
  await connectDB();

  if (!bookBarcode && !patronBarcode) {
    return { success: false, error: 'Either a book barcode or patron barcode is required for check-in.' };
  }

  let book: ICatalogingDocument | null = null;
  let patron: IPatronDocument | null = null;

  // If book barcode provided
  if (bookBarcode) {
    book = await Cataloging.findOne({ barcode: bookBarcode.trim() });
    if (!book) {
      return { success: false, error: `Book with barcode "${bookBarcode}" not found in catalog.` };
    }
    if (!book.isCheckedOut && !book.lastBorrowedBy?.checkedOutAt) {
      return { success: false, error: `Book "${book.title}" is not currently marked as checked out.` };
    }

    if (book.checkedOutBy) {
      patron = await Patron.findById(book.checkedOutBy);
    } else if (book.lastBorrowedBy?.patronBarcode) {
      patron = await Patron.findOne({ barcode: book.lastBorrowedBy.patronBarcode });
    }
  }

  // If patron barcode provided
  if (!patron && patronBarcode) {
    patron = await Patron.findOne({ barcode: patronBarcode.trim() });
    if (!patron) {
      return { success: false, error: `Patron with barcode "${patronBarcode}" not found.` };
    }
    if (!patron.hasBorrowedBook && !patron.lastBorrowedItem?.itemId) {
      return { success: false, error: `Patron (${patron.firstname} ${patron.surname}) does not have an active borrowed book.` };
    }
    if (!book && patron.lastBorrowedItem?.itemId) {
      book = await Cataloging.findById(patron.lastBorrowedItem.itemId);
    } else if (!book && patron.lastBorrowedItem?.itemBarcode) {
      book = await Cataloging.findOne({ barcode: patron.lastBorrowedItem.itemBarcode });
    }
  }

  if (!book) {
    return { success: false, error: 'Could not resolve the catalog book associated with this loan.' };
  }

  const now = new Date();
  const receivedByObjectId =
    receivedByUserId && mongoose.Types.ObjectId.isValid(receivedByUserId)
      ? new mongoose.Types.ObjectId(receivedByUserId)
      : undefined;

  // 1. Update Cataloging
  book.isCheckedOut = false;
  book.checkedOutBy = null;
  book.checkedOutAt = null;
  book.copiesAvailable = Math.min(book.copiesTotal ?? 1, (book.copiesAvailable ?? 0) + 1);

  if (book.lastBorrowedBy) {
    book.lastBorrowedBy.returnedAt = now;
  }

  if (book.patronsCheckedOutHistory && book.patronsCheckedOutHistory.length > 0) {
    const latestEntry = book.patronsCheckedOutHistory[book.patronsCheckedOutHistory.length - 1];
    if (!latestEntry.returnedAt) {
      latestEntry.returnedAt = now;
    }
  }
  await book.save();

  // 2. Update Library Circulation Record & Calculate Timely Return Points
  const activeLoan = await Library.findOne({
    bookBarcode: book.barcode,
    status: 'borrowed',
  }).sort({ createdAt: -1 });

  const dueDate = activeLoan?.dueDate
    ? new Date(activeLoan.dueDate)
    : (book.lastBorrowedBy?.dueDate ? new Date(book.lastBorrowedBy.dueDate) : now);

  const diffMs = now.getTime() - dueDate.getTime();
  let daysLate = 0;
  let pointsAwarded = 0;

  if (now <= dueDate) {
    // Returned on or before due date: +3 points
    pointsAwarded = 3;
    daysLate = 0;
  } else {
    // Returned late: 1-2 days = +1 point, 3+ days = 0 points
    daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLate <= 2) {
      pointsAwarded = 1;
    } else {
      pointsAwarded = 0;
    }
  }

  // 3. Update Patron & MonthlyActivity Points
  if (patron) {
    patron.hasBorrowedBook = false;
    patron.points = (patron.points || 0) + pointsAwarded;
    if (patron.lastBorrowedItem) {
      patron.lastBorrowedItem.returnedAt = now;
    }
    await patron.save();

    // Upsert MonthlyActivity
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const patronFullName = `${patron.firstname} ${patron.surname}`.trim();

    await MonthlyActivity.findOneAndUpdate(
      {
        patronId: patron._id,
        year: currentYear,
        month: currentMonth,
      },
      {
        $setOnInsert: {
          patronId: patron._id,
          patronBarcode: patron.barcode,
          patronName: patronFullName,
          year: currentYear,
          month: currentMonth,
          monthYear,
          library: 'AAoJ',
          isActive: true,
        },
        $inc: {
          booksReturned: 1,
          totalPoints: pointsAwarded,
          pointsFromBooks: pointsAwarded,
          circulationPoints: pointsAwarded,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 4. Update Library Circulation Record
  if (activeLoan) {
    activeLoan.status = 'returned';
    activeLoan.returnDate = now;
    activeLoan.receivedBy = receivedByObjectId;
    activeLoan.pointsAwarded = pointsAwarded;
    await activeLoan.save();
  }

  // 5. Check for active waiting holds on this book
  const waitingHold = await Hold.findOne({
    bookBarcode: book.barcode,
    status: 'waiting',
  }).sort({ createdAt: 1 });

  let holdNotice: CheckInResult['holdNotice'] = null;
  if (waitingHold) {
    waitingHold.status = 'ready';
    waitingHold.notifiedAt = now;
    await waitingHold.save();
    holdNotice = {
      holdId: String(waitingHold._id),
      patronBarcode: waitingHold.patronBarcode,
      patronName: waitingHold.patronName,
    };
  }

  return {
    success: true,
    patron: patron || undefined,
    book,
    returnDate: now,
    pointsAwarded,
    daysLate,
    holdNotice,
  };
}

/**
 * Renews an active book loan, extending the dueDate by extendDays (default 2 days).
 */
export async function executeRenewal({
  bookBarcode,
  loanId,
  extendDays = 2,
}: {
  bookBarcode?: string;
  loanId?: string;
  extendDays?: number;
}): Promise<RenewalResult> {
  await connectDB();

  let loan: ILibraryDocument | null = null;
  if (loanId && mongoose.Types.ObjectId.isValid(loanId)) {
    loan = await Library.findById(loanId);
  } else if (bookBarcode) {
    loan = await Library.findOne({ bookBarcode: bookBarcode.trim(), status: 'borrowed' });
  }

  if (!loan) {
    // If no Library record exists yet, check if book is checked out in Cataloging
    if (bookBarcode) {
      const book = await Cataloging.findOne({ barcode: bookBarcode.trim(), isCheckedOut: true });
      if (book) {
        // Backfill a Library record so renewal can proceed
        const patron = book.checkedOutBy ? await Patron.findById(book.checkedOutBy) : null;
        loan = await Library.create({
          patronId: patron?._id,
          patronBarcode: patron?.barcode || book.lastBorrowedBy?.patronBarcode,
          bookId: book._id,
          bookBarcode: book.barcode,
          bookTitle: getBookTitleString(book),
          issueDate: book.checkedOutAt || new Date(),
          dueDate: book.lastBorrowedBy?.dueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'borrowed',
          renewalsCount: 0,
        });
      }
    }
  }

  if (!loan) {
    return { success: false, error: 'Active loan record not found for renewal.' };
  }

  if (loan.status !== 'borrowed') {
    return { success: false, error: `Loan is already marked as ${loan.status} and cannot be renewed.` };
  }

  const currentRenewals = loan.renewalsCount || 0;
  if (currentRenewals >= 2) {
    return { success: false, error: 'Maximum 2 renewals allowed for this book loan.' };
  }

  // Verify if an active hold reservation exists for this book
  const waitingHold = await Hold.findOne({
    bookBarcode: loan.bookBarcode,
    status: { $in: ['waiting', 'ready'] },
  });

  if (waitingHold) {
    return {
      success: false,
      error: `Cannot renew: An active hold reservation is waiting for this book (${waitingHold.patronName}). Please return the book for the waiting patron.`,
    };
  }

  const baseDate = loan.dueDate && loan.dueDate > new Date() ? loan.dueDate : new Date();
  const effectiveDays = Math.max(1, extendDays || 2);
  const newDueDate = new Date(baseDate.getTime() + effectiveDays * 24 * 60 * 60 * 1000);

  loan.renewalsCount = currentRenewals + 1;
  loan.dueDate = newDueDate;
  await loan.save();

  // Synchronize Cataloging
  if (loan.bookBarcode) {
    await Cataloging.updateOne(
      { barcode: loan.bookBarcode },
      { $set: { 'lastBorrowedBy.dueDate': newDueDate } }
    );
  }

  // Synchronize Patron
  if (loan.patronBarcode) {
    await Patron.updateOne(
      { barcode: loan.patronBarcode },
      { $set: { 'lastBorrowedItem.dueDate': newDueDate } }
    );
  }

  return {
    success: true,
    newDueDate,
    renewalsCount: loan.renewalsCount,
  };
}

/**
 * Returns all active loans across the institution, backfilling missing Library documents from live Cataloging.
 */
export async function getActiveLoans(): Promise<ActiveLoanDTO[]> {
  await connectDB();
  const now = new Date();

  // Find all books currently marked isCheckedOut: true
  const checkedOutBooks = await Cataloging.find({ isCheckedOut: true })
    .select('barcode title image_url shelfLocation checkedOutBy checkedOutAt lastBorrowedBy')
    .lean();

  const loansMap = new Map<string, ActiveLoanDTO>();

  // 1. Load active loans from Library collection
  const libraryLoans = await Library.find({ status: 'borrowed' })
    .sort({ dueDate: 1 })
    .lean();

  for (const l of libraryLoans) {
    if (!l.bookBarcode) continue;
    const due = l.dueDate ? new Date(l.dueDate) : new Date();
    const isOverdue = due < now;
    const diffMs = now.getTime() - due.getTime();
    const overdueDays = isOverdue ? Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

    loansMap.set(l.bookBarcode, {
      id: String(l._id),
      bookId: l.bookId ? String(l.bookId) : '',
      bookBarcode: l.bookBarcode,
      bookTitle: l.bookTitle || 'Untitled Book',
      patronId: l.patronId ? String(l.patronId) : '',
      patronBarcode: l.patronBarcode || '',
      patronName: '', // will populate below
      issueDate: l.issueDate ? new Date(l.issueDate).toISOString() : new Date().toISOString(),
      dueDate: due.toISOString(),
      renewalsCount: l.renewalsCount || 0,
      status: isOverdue ? 'overdue' : 'borrowed',
      isOverdue,
      overdueDays,
      eventTitle: l.eventTitle,
      pointsAwarded: l.pointsAwarded || 0,
    });
  }

  // 2. Check for any Cataloging books with isCheckedOut: true not yet in loansMap
  for (const b of checkedOutBooks) {
    if (!loansMap.has(b.barcode)) {
      const due = b.lastBorrowedBy?.dueDate ? new Date(b.lastBorrowedBy.dueDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const isOverdue = due < now;
      const diffMs = now.getTime() - due.getTime();
      const overdueDays = isOverdue ? Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

      loansMap.set(b.barcode, {
        id: String(b._id),
        bookId: String(b._id),
        bookBarcode: b.barcode,
        bookTitle: getBookTitleString(b),
        bookCover: b.image_url,
        shelfLocation: b.shelfLocation,
        patronId: b.lastBorrowedBy?.patronId ? String(b.lastBorrowedBy.patronId) : '',
        patronBarcode: b.lastBorrowedBy?.patronBarcode || '',
        patronName: b.lastBorrowedBy?.patronName || '',
        issueDate: b.checkedOutAt ? new Date(b.checkedOutAt).toISOString() : new Date().toISOString(),
        dueDate: due.toISOString(),
        renewalsCount: 0,
        status: isOverdue ? 'overdue' : 'borrowed',
        isOverdue,
        overdueDays,
        eventTitle: undefined,
        pointsAwarded: 0,
      });
    }
  }

  const loansArray = Array.from(loansMap.values());

  // Enrich patron information (photos, names, classes)
  const patronBarcodes = Array.from(new Set(loansArray.map((l) => l.patronBarcode).filter(Boolean)));
  if (patronBarcodes.length > 0) {
    const patrons = await Patron.find({ barcode: { $in: patronBarcodes } })
      .select('barcode firstname surname image_url studentSchoolInfo')
      .lean();

    const patronInfoMap = new Map(patrons.map((p) => [p.barcode, p]));

    for (const loan of loansArray) {
      const p = patronInfoMap.get(loan.patronBarcode);
      if (p) {
        loan.patronName = `${p.firstname} ${p.surname}`.trim();
        loan.patronPhoto = p.image_url?.secure_url;
        loan.patronClass = p.studentSchoolInfo?.currentClass || 'N/A';
      }
    }
  }

  // Sort: Overdues first (highest days overdue), then earliest due date
  loansArray.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.isOverdue && b.isOverdue) return b.overdueDays - a.overdueDays;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return loansArray;
}

/**
 * Returns summary counts for circulation dashboard.
 */
export async function getCirculationStats() {
  await connectDB();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeLoans = await getActiveLoans();
  const activeCount = activeLoans.length;
  const overdueCount = activeLoans.filter((l) => l.isOverdue).length;

  // Returned today count
  const returnedToday = await Library.countDocuments({
    status: 'returned',
    returnDate: { $gte: startOfDay },
  });

  // Monthly total checkouts count
  const monthlyCheckouts = await Library.countDocuments({
    issueDate: { $gte: startOfMonth },
  });

  return {
    activeLoansCount: activeCount,
    overdueLoansCount: overdueCount,
    returnedTodayCount: returnedToday,
    monthlyCheckoutsCount: Math.max(activeCount, monthlyCheckouts),
  };
}

/**
 * Universal scanner lookup: auto-detects whether a scanned code belongs to a patron or book.
 */
export async function universalBarcodeLookup(barcode: string) {
  await connectDB();
  const clean = barcode.trim();

  // 1. Try Patron Lookup
  const patron = await Patron.findOne({ barcode: clean, isDeleted: { $ne: true } })
    .select('firstname surname barcode patronType gender points hasBorrowedBook lastBorrowedItem image_url active studentSchoolInfo')
    .lean();

  if (patron) {
    let activeLoanDetails: ActiveLoanDTO | null = null;
    if (patron.hasBorrowedBook && patron.lastBorrowedItem?.itemBarcode) {
      const activeLoans = await getActiveLoans();
      activeLoanDetails = activeLoans.find((l) => l.patronBarcode === patron.barcode) || null;
    }

    return {
      type: 'patron' as const,
      patron: {
        id: String(patron._id),
        name: `${patron.firstname} ${patron.surname}`.trim(),
        barcode: patron.barcode,
        patronType: patron.patronType,
        gender: patron.gender,
        classGrade: patron.studentSchoolInfo?.currentClass || 'N/A',
        points: patron.points || 0,
        hasBorrowedBook: patron.hasBorrowedBook,
        photoUrl: patron.image_url?.secure_url,
        isActive: patron.active,
        activeLoan: activeLoanDetails,
      },
    };
  }

  // 2. Try Catalog Book Lookup
  const book = await Cataloging.findOne({ barcode: clean })
    .select('title subtitle author classification controlNumber barcode isCheckedOut copiesTotal copiesAvailable shelfLocation image_url lastBorrowedBy')
    .lean();

  if (book) {
    return {
      type: 'book' as const,
      book: {
        id: String(book._id),
        title: getBookTitleString(book),
        author: (typeof book.author === 'string' ? book.author : (book.author as { mainAuthor?: string })?.mainAuthor) || 'Unknown Author',
        classification: book.classification,
        controlNumber: book.controlNumber,
        barcode: book.barcode,
        isCheckedOut: book.isCheckedOut,
        copiesTotal: book.copiesTotal ?? 1,
        copiesAvailable: book.copiesAvailable ?? (book.isCheckedOut ? 0 : 1),
        shelfLocation: book.shelfLocation || 'Main Stacks',
        coverUrl: book.image_url,
        lastBorrowedBy: book.lastBorrowedBy,
      },
    };
  }

  return {
    type: 'unknown' as const,
    barcode: clean,
  };
}
