'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from 'next/link';

import { dzfColors } from '@/theme/colors';
import {
  DZFButton,
  DZFInput,
  PageHeader,
  Mono,
  PrinterIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  BookIcon,
  UploadIcon,
} from '@/components';
import { ITokenPayload } from '@/lib/auth/jwt';
import { DEWEY_CLASSES } from '@/lib/catalog/constants';
import { ThermalBookPrintDialog, ThermalBookLabelData } from '@/components/catalog';

interface BookAcquireClientProps {
  user: ITokenPayload | null;
}

export default function BookAcquireClient({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  user,
}: BookAcquireClientProps) {
  // Bibliographic State
  const [mainTitle, setMainTitle] = React.useState('');
  const [subtitle, setSubtitle] = React.useState('');
  const [mainAuthor, setMainAuthor] = React.useState('');
  const [additionalAuthors, setAdditionalAuthors] = React.useState('');
  const [publisher, setPublisher] = React.useState('');
  const [place, setPlace] = React.useState('Nigeria');
  const [year, setYear] = React.useState(String(new Date().getFullYear()));
  const [ISBN, setISBN] = React.useState('');
  const [language, setLanguage] = React.useState('english');
  const [physicalDescription, setPhysicalDescription] = React.useState('');
  const [informationSummary, setInformationSummary] = React.useState('');
  const [indexTermGenre, setIndexTermGenre] = React.useState('Literature');

  // Classification & Accession State
  const [classification, setClassification] = React.useState('800');
  const [nextControlNumber, setNextControlNumber] = React.useState('800.1');
  const [suggestedBarcode, setSuggestedBarcode] = React.useState('');
  const [customBarcode, setCustomBarcode] = React.useState('');
  const [copiesTotal, setCopiesTotal] = React.useState('1');
  const [shelfLocation, setShelfLocation] = React.useState('Bay 3, Shelf B');
  const [loadingAccession, setLoadingAccession] = React.useState(false);

  // Book Cover Upload State
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form State
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [registeredBook, setRegisteredBook] = React.useState<{
    title: string;
    controlNumber: string;
    barcode: string;
    classification: string;
    shelfLocation: string;
  } | null>(null);

  // Thermal Print Dialog State
  const [printLabels, setPrintLabels] = React.useState<ThermalBookLabelData[] | null>(null);

  // Fetch next control number whenever classification or year changes
  React.useEffect(() => {
    let active = true;

    async function fetchAccession() {
      setLoadingAccession(true);
      try {
        const res = await fetch(`/api/catalog/next-accession?classification=${classification}&year=${year}`);
        const data = await res.json();
        if (active && data.success) {
          setNextControlNumber(data.nextControlNumber);
          setSuggestedBarcode(data.suggestedBarcode);
        }
      } catch (err) {
        console.error('Failed to load next accession:', err);
      } finally {
        if (active) setLoadingAccession(false);
      }
    }

    fetchAccession();

    return () => {
      active = false;
    };
  }, [classification, year]);

  // Handle Cover Image Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadingCover(true);
      setError(null);
      try {
        const res = await fetch('/api/upload/book-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            barcode: customBarcode || suggestedBarcode,
            controlNumber: nextControlNumber,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setCoverUrl(data.secure_url);
        } else {
          setError(data.error || 'Failed to upload book cover.');
        }
      } catch (err) {
        setError('Network error while uploading cover image.');
        console.error(err);
      } finally {
        setUploadingCover(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Book Acquisition
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mainTitle.trim()) {
      setError('Book main title is required.');
      return;
    }
    if (!mainAuthor.trim()) {
      setError('Main author is required.');
      return;
    }
    if (!publisher.trim()) {
      setError('Publisher is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        mainTitle: mainTitle.trim(),
        subtitle: subtitle.trim(),
        mainAuthor: mainAuthor.trim(),
        additionalAuthors: additionalAuthors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        publisher: publisher.trim(),
        place: place.trim(),
        year: parseInt(year, 10) || new Date().getFullYear(),
        ISBN: ISBN.trim(),
        classification: classification.trim(),
        controlNumber: nextControlNumber,
        barcode: customBarcode.trim() || suggestedBarcode,
        language: language.trim(),
        physicalDescription: physicalDescription.trim(),
        informationSummary: informationSummary.trim(),
        indexTermGenre: indexTermGenre
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
        copiesTotal: parseInt(copiesTotal, 10) || 1,
        shelfLocation: shelfLocation.trim(),
        image_url: coverUrl || '',
      };

      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to acquire and catalog book.');
      }

      const assigned = {
        title: data.book.title.mainTitle,
        controlNumber: data.book.controlNumber,
        barcode: data.book.barcode,
        classification: data.book.classification,
        shelfLocation: data.book.shelfLocation || 'Main Stacks',
      };

      setRegisteredBook(assigned);

      // Open print dialog immediately
      setPrintLabels([
        {
          barcode: assigned.barcode,
          title: assigned.title,
          controlNumber: assigned.controlNumber,
          classification: assigned.classification,
          shelfLocation: assigned.shelfLocation,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during book acquisition.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNew = () => {
    setRegisteredBook(null);
    setMainTitle('');
    setSubtitle('');
    setMainAuthor('');
    setAdditionalAuthors('');
    setPublisher('');
    setISBN('');
    setPhysicalDescription('');
    setInformationSummary('');
    setCustomBarcode('');
    setCoverUrl(null);
    setError(null);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Top Breadcrumb & Page Header */}
      <Box sx={{ mb: 3 }}>
        <Link href="/catalog" style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              color: dzfColors.navy[700],
              fontWeight: 600,
              fontSize: '0.875rem',
              mb: 1.5,
              '&:hover': { color: dzfColors.maroon[900] },
            }}
          >
            <ArrowLeftIcon size={16} />
            Back to Book Catalog
          </Box>
        </Link>

        <PageHeader
          kicker="STATION AAoJ • ACCESSION ENGINE"
          title="Acquire & Catalog New Book"
          subtitle="Register new book monographs with automated Dewey Decimal accession numbering, shelf mapping, copy labeling, and instant 60×40mm thermal printing."
        />
      </Box>

      {/* Success Confirmation Card */}
      {registeredBook ? (
        <Card
          sx={{
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
            borderRadius: 3,
            border: `2px solid ${dzfColors.gold[400]}`,
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 30px rgba(204, 163, 73, 0.15)',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircleIcon size={36} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 800, color: dzfColors.navy[900], mb: 1, textTransform: 'capitalize' }}>
            {registeredBook.title}
          </Typography>

          <Typography variant="body1" sx={{ color: dzfColors.surfaces.textSecondary, mb: 3 }}>
            Successfully cataloged and added to Station AAoJ library inventory.
          </Typography>

          {/* Assigned Call & Barcode Banner */}
          <Box
            sx={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: `1.5px solid ${dzfColors.surfaces.border}`,
              borderRadius: 2,
              px: 4,
              py: 2,
              mb: 4,
            }}
          >
            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, fontWeight: 700 }}>
              ASSIGNED ACCESSION CONTROL & BARCODE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 0.5 }}>
              <Mono sx={{ fontSize: '1.25rem', fontWeight: 800, color: dzfColors.gold[700] }}>
                {registeredBook.controlNumber}
              </Mono>
              <Typography variant="body2" sx={{ color: dzfColors.surfaces.textMuted }}>•</Typography>
              <Mono sx={{ fontSize: '1.25rem', fontWeight: 800, color: dzfColors.maroon[900] }}>
                {registeredBook.barcode}
              </Mono>
            </Box>
            <Typography variant="caption" sx={{ color: dzfColors.navy[700], fontWeight: 600 }}>
              Location: {registeredBook.shelfLocation}
            </Typography>
          </Box>

          {/* Action CTAs */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            <DZFButton
              variant="primary"
              size="large"
              startIcon={<PrinterIcon size={20} />}
              onClick={() =>
                setPrintLabels([
                  {
                    barcode: registeredBook.barcode,
                    title: registeredBook.title,
                    controlNumber: registeredBook.controlNumber,
                    classification: registeredBook.classification,
                    shelfLocation: registeredBook.shelfLocation,
                  },
                ])
              }
            >
              Print 60×40mm Spine Label
            </DZFButton>

            <DZFButton
              variant="secondary"
              size="large"
              startIcon={<BookIcon size={20} />}
              onClick={handleResetForNew}
            >
              Catalog Another Book
            </DZFButton>

            <Link href="/catalog" style={{ textDecoration: 'none' }}>
              <DZFButton variant="soft" size="large">
                Return to Catalog Directory
              </DZFButton>
            </Link>
          </Box>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Left 8 Cols: Bibliographic & Classification Details */}
            <Grid size={{ xs: 12, md: 8 }}>
              {/* Card 1: Bibliographic Information */}
              <Card
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  borderRadius: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: dzfColors.navy[900], mb: 2 }}>
                  1. Bibliographic Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <DZFInput
                      label="Book Main Title"
                      required
                      placeholder="e.g. Things Fall Apart"
                      value={mainTitle}
                      onChange={(e) => setMainTitle(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <DZFInput
                      label="Subtitle (Optional)"
                      placeholder="e.g. An African Classic"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Main Author"
                      required
                      placeholder="e.g. Chinua Achebe"
                      value={mainAuthor}
                      onChange={(e) => setMainAuthor(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Additional Authors (Comma Separated)"
                      placeholder="e.g. Wole Soyinka, Chimamanda Adichie"
                      value={additionalAuthors}
                      onChange={(e) => setAdditionalAuthors(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Publisher"
                      required
                      placeholder="e.g. Heinemann African Writers Series"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DZFInput
                      label="Place of Publication"
                      placeholder="e.g. London / Lagos"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DZFInput
                      label="Year"
                      type="number"
                      placeholder="2026"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="ISBN"
                      placeholder="e.g. 9780435905255"
                      value={ISBN}
                      onChange={(e) => setISBN(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Genres & Index Terms (Comma Separated)"
                      placeholder="Literature, African Studies, Classic"
                      value={indexTermGenre}
                      onChange={(e) => setIndexTermGenre(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Physical Description"
                      placeholder="e.g. 209 pages ; 20 cm"
                      value={physicalDescription}
                      onChange={(e) => setPhysicalDescription(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <DZFInput
                      label="Summary / Annotation"
                      placeholder="Brief synopsis of the book content..."
                      value={informationSummary}
                      onChange={(e) => setInformationSummary(e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Card>

              {/* Card 2: Dewey Classification & Shelf Mapping */}
              <Card
                sx={{
                  p: 3,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  borderRadius: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: dzfColors.navy[900], mb: 2 }}>
                  2. Classification, Shelf Mapping & Copies
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      select
                      label="Dewey Decimal Main Class"
                      required
                      value={classification}
                      onChange={(e) => setClassification(e.target.value)}
                      fullWidth
                    >
                      {DEWEY_CLASSES.map((dc) => (
                        <MenuItem key={dc.code} value={dc.code}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                              {dc.code} – {dc.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                              {dc.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </DZFInput>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Physical Shelf Location"
                      required
                      placeholder="e.g. Bay 3, Shelf B"
                      value={shelfLocation}
                      onChange={(e) => setShelfLocation(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Total Copies Acquired"
                      type="number"
                      required
                      value={copiesTotal}
                      onChange={(e) => setCopiesTotal(e.target.value)}
                      fullWidth
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DZFInput
                      label="Custom Barcode (Optional)"
                      placeholder="Leave blank to use auto-generated"
                      value={customBarcode}
                      onChange={(e) => setCustomBarcode(e.target.value)}
                      helperText="Scan physical barcode copy or let the system auto-generate."
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Right 4 Cols: Live Preview, Cover Upload & Submit */}
            <Grid size={{ xs: 12, md: 4 }}>
              {/* Accession Preview Card */}
              <Card
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: '#ffffff',
                  border: `1.5px solid ${dzfColors.gold[400]}`,
                  borderRadius: 3,
                  boxShadow: '0 4px 15px rgba(204, 163, 73, 0.08)',
                }}
              >
                <Typography variant="overline" sx={{ fontWeight: 800, color: dzfColors.gold[700], letterSpacing: '0.08em' }}>
                  ACCESSION CONTROL PREVIEW
                </Typography>

                <Box sx={{ my: 1.5 }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                    Next Control Number
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Mono sx={{ fontSize: '1.25rem', fontWeight: 800, color: dzfColors.maroon[900] }}>
                      {nextControlNumber}
                    </Mono>
                    {loadingAccession && <CircularProgress size={16} />}
                  </Box>
                </Box>

                <Box sx={{ my: 1.5 }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                    Suggested Barcode
                  </Typography>
                  <Mono sx={{ fontSize: '1.1rem', fontWeight: 700, color: dzfColors.navy[900] }}>
                    {customBarcode || suggestedBarcode}
                  </Mono>
                </Box>

                <Box sx={{ my: 1.5, p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: `1px solid ${dzfColors.surfaces.border}` }}>
                  <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block' }}>
                    Call Number on Label
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: dzfColors.navy[900] }}>
                    {nextControlNumber} • {shelfLocation || 'Main Stacks'}
                  </Typography>
                </Box>
              </Card>

              {/* Book Cover Upload Card */}
              <Card
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dzfColors.surfaces.border}`,
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontSize: '0.9375rem', fontWeight: 700, color: dzfColors.navy[900], mb: 1.5 }}>
                  Book Cover Image
                </Typography>

                <Box
                  sx={{
                    width: '100%',
                    height: 180,
                    borderRadius: 2,
                    backgroundColor: '#f1f5f9',
                    border: `2px dashed ${coverUrl ? dzfColors.gold[400] : '#cbd5e1'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: dzfColors.maroon[700] },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingCover ? (
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <CircularProgress size={32} sx={{ color: dzfColors.maroon[900], mb: 1 }} />
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                        Uploading to Cloudinary...
                      </Typography>
                    </Box>
                  ) : coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ p: 2 }}>
                      <UploadIcon size={32} color={dzfColors.surfaces.textMuted} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: dzfColors.navy[700], mt: 1 }}>
                        Click to Upload Cover
                      </Typography>
                      <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                        JPG, PNG, WebP (Max 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />

                {coverUrl && (
                  <DZFButton
                    variant="soft"
                    size="small"
                    onClick={() => {
                      setCoverUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Remove Cover
                  </DZFButton>
                )}
              </Card>

              {/* Submit Button */}
              <DZFButton
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <BookIcon size={20} />}
              >
                {submitting ? 'Acquiring Book...' : 'Acquire & Print Label'}
              </DZFButton>
            </Grid>
          </Grid>
        </form>
      )}

      {/* Thermal Print Dialog (60×40mm) */}
      <ThermalBookPrintDialog
        open={Boolean(printLabels)}
        onClose={() => setPrintLabels(null)}
        labels={printLabels}
      />
    </Box>
  );
}
