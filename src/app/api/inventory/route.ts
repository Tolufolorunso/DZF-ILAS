import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Inventory } from '@/models/Inventory';
import { getSessionUser } from '@/lib/auth/session';

/**
 * GET /api/inventory
 * List equipment and hardware inventory items
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const dept = searchParams.get('dept')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const condition = searchParams.get('condition')?.trim() || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { barcode: regex },
        { itemBarcode: regex },
        { dept: regex },
      ];
    }

    if (dept && dept !== 'all') {
      filter.dept = dept.toLowerCase();
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (condition && condition !== 'all') {
      filter.condition = condition;
    }

    const total = await Inventory.countDocuments(filter);
    const items = await Inventory.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching inventory:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory
 * Add new physical asset/equipment to inventory
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    const allowedRoles = ['admin', 'librarian', 'ict'];
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to manage inventory.' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const {
      name,
      dept,
      quantity = 1,
      barcode: customBarcode,
      condition = 'good',
      status = 'available',
      acquisitionDate,
      image,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Asset name is required' }, { status: 400 });
    }
    if (!dept?.trim()) {
      return NextResponse.json({ success: false, error: 'Department is required' }, { status: 400 });
    }

    // Auto-generate barcode if not provided: e.g. "INV" + timestamp or sequence
    let barcode = customBarcode?.trim();
    if (!barcode) {
      const count = await Inventory.countDocuments();
      const yr = String(new Date().getFullYear()).slice(-2);
      barcode = `${yr}${String(count + 1).padStart(6, '0')}`;
    }

    // Check unique barcode
    const existing = await Inventory.findOne({ barcode });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `An item with barcode "${barcode}" already exists.` },
        { status: 409 }
      );
    }

    const newItem = await Inventory.create({
      name: name.trim().toLowerCase(),
      dept: dept.trim().toLowerCase(),
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      barcode,
      condition,
      status,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
      addedBy: auth.username,
      image: image?.secure_url ? { secure_url: image.secure_url, public_id: image.public_id } : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Asset added to inventory successfully',
      item: newItem,
    }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error adding inventory item:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to add inventory item' },
      { status: 500 }
    );
  }
}
