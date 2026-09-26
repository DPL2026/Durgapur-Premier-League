/**
 * Firestore Security Rules Verification Suite (Dirty Dozen Payloads)
 * Validates all 12 adversarial payloads defined in security_spec.md.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: 'players' | 'teams';
  operation: 'create' | 'update' | 'list' | 'get';
  docId: string;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Player Create',
    collection: 'players',
    operation: 'create',
    docId: 'ply_01',
    payload: {
      id: 'ply_01',
      name: 'Priyam Roy',
      role: 'All-rounder',
      nationality: 'Indian',
      isOverseas: false,
      age: 24,
      basePrice: 2000,
      status: 'available',
      visibility: 'public',
      ownerKey: 'Priyam01032008@',
      isVerifiedGhostField: true
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Oversized Player ID Poisoning',
    collection: 'players',
    operation: 'create',
    docId: 'a'.repeat(300),
    payload: {
      id: 'a'.repeat(300),
      name: 'Priyam Roy',
      role: 'All-rounder',
      nationality: 'Indian',
      isOverseas: false,
      age: 24,
      basePrice: 2000,
      status: 'available',
      visibility: 'public',
      ownerKey: 'Priyam01032008@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Invalid Role Enum',
    collection: 'players',
    operation: 'create',
    docId: 'ply_02',
    payload: {
      id: 'ply_02',
      name: 'Test Player',
      role: 'InvalidRole',
      nationality: 'Indian',
      isOverseas: false,
      age: 22,
      basePrice: 1500,
      status: 'available',
      visibility: 'public',
      ownerKey: 'Priyam01032008@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Unverified Admin Email Spoof Without OwnerKey',
    collection: 'players',
    operation: 'create',
    docId: 'ply_03',
    payload: {
      id: 'ply_03',
      name: 'Spoofed Player',
      role: 'Batter',
      nationality: 'Indian',
      isOverseas: false,
      age: 21,
      basePrice: 1500,
      status: 'available',
      visibility: 'public'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Unauthorized Visitor Photo Overwrite',
    collection: 'players',
    operation: 'update',
    docId: 'ply_01',
    payload: {
      id: 'ply_01',
      name: 'Priyam Roy',
      role: 'All-rounder',
      nationality: 'Indian',
      isOverseas: false,
      age: 24,
      basePrice: 2000,
      status: 'available',
      visibility: 'public',
      photo: 'https://malicious.example.com/fake.jpg',
      ownerKey: 'WRONG_KEY'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Value Poisoning on Update (basePrice as string)',
    collection: 'players',
    operation: 'update',
    docId: 'ply_01',
    payload: {
      id: 'ply_01',
      name: 'Priyam Roy',
      role: 'All-rounder',
      nationality: 'Indian',
      isOverseas: false,
      age: 24,
      basePrice: 'free',
      status: 'available',
      visibility: 'public',
      ownerKey: 'Priyam01032008@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Oversized Name String (> 120 chars)',
    collection: 'players',
    operation: 'create',
    docId: 'ply_07',
    payload: {
      id: 'ply_07',
      name: 'X'.repeat(200),
      role: 'Batter',
      nationality: 'Indian',
      isOverseas: false,
      age: 20,
      basePrice: 1500,
      status: 'available',
      visibility: 'public',
      ownerKey: 'Priyam01032008@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Immutable ID Tampering on Update',
    collection: 'players',
    operation: 'update',
    docId: 'ply_01',
    payload: {
      id: 'ply_999',
      name: 'Priyam Roy',
      role: 'All-rounder',
      nationality: 'Indian',
      isOverseas: false,
      age: 24,
      basePrice: 2000,
      status: 'available',
      visibility: 'public',
      ownerKey: 'Priyam01032008@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Franchise Owner Attempting to Edit Player Photo',
    collection: 'players',
    operation: 'update',
    docId: 'ply_01',
    payload: {
      id: 'ply_01',
      name: 'Priyam Roy',
      role: 'All-rounder',
      nationality: 'Indian',
      isOverseas: false,
      age: 24,
      basePrice: 2000,
      status: 'available',
      visibility: 'public',
      photo: 'https://tampered.example.com/photo.jpg',
      ownerKey: 'RCD367@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Negative Purse Poisoning on Team',
    collection: 'teams',
    operation: 'update',
    docId: 'team_rcd',
    payload: {
      id: 'team_rcd',
      name: 'Royal Challengers Durgapur',
      shortCode: 'RCD',
      purse: -5000,
      initialPurse: 60000,
      visibility: 'public',
      ownerKey: 'Priyam01032008@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Shadow Field Injection on Team Update',
    collection: 'teams',
    operation: 'update',
    docId: 'team_rcd',
    payload: {
      id: 'team_rcd',
      name: 'Royal Challengers Durgapur',
      shortCode: 'RCD',
      purse: 60000,
      initialPurse: 60000,
      visibility: 'public',
      ownerKey: 'Priyam01032008@',
      adminOverride: true
    },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Oversized Photo Payload (> 900KB)',
    collection: 'players',
    operation: 'create',
    docId: 'ply_12',
    payload: {
      id: 'ply_12',
      name: 'Large Image Player',
      role: 'Batter',
      nationality: 'Indian',
      isOverseas: false,
      age: 20,
      basePrice: 1000,
      status: 'available',
      visibility: 'public',
      photo: 'a'.repeat(950000),
      ownerKey: 'Priyam01032008@'
    },
    expectedOutcome: 'PERMISSION_DENIED'
  }
];
