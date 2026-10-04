import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB, { getConnectionState } from '@/lib/db';

// Explicitly import the model registry to trigger schema registration
import {
  User,
  Patron,
  Cataloging,
  Library,
  Inventory,
  BookSummary,
  Attendance,
  Cohort,
  CohortGroup,
  MonthlyActivity,
  Competition,
  TranscommArticle,
  Requisition,
  Task,
  Event,
  Counter,
} from '@/models';

// Map of all 16 registered production models
const DOMAIN_MODELS = [
  User.modelName,
  Patron.modelName,
  Cataloging.modelName,
  Library.modelName,
  Inventory.modelName,
  BookSummary.modelName,
  Attendance.modelName,
  Cohort.modelName,
  CohortGroup.modelName,
  MonthlyActivity.modelName,
  Competition.modelName,
  TranscommArticle.modelName,
  Requisition.modelName,
  Task.modelName,
  Event.modelName,
  Counter.modelName,
];

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const conn = await connectDB();
    const connState = getConnectionState();
    const registeredModelNames = mongoose.modelNames();

    return NextResponse.json({
      status: connState.readyState === 1 ? 'ok' : 'degraded',
      database: {
        status: connState.status,
        readyState: connState.readyState,
        host: conn.connection.host || 'localhost',
        name: conn.connection.name || 'dzuelsDB',
      },
      models: {
        totalExpected: DOMAIN_MODELS.length,
        totalRegistered: registeredModelNames.length,
        domainModels: DOMAIN_MODELS,
        registered: registeredModelNames,
      },
      timestamp,
    });
  } catch (error) {
    const err = error as Error;
    const connState = getConnectionState();

    return NextResponse.json(
      {
        status: 'error',
        error: err.message || 'Database connection error',
        database: {
          status: connState.status,
          readyState: connState.readyState,
        },
        models: {
          totalExpected: DOMAIN_MODELS.length,
          domainModels: DOMAIN_MODELS,
          registered: mongoose.modelNames(),
        },
        timestamp,
      },
      { status: 503 }
    );
  }
}
