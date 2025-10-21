import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, deleteUser, updateUserStatus } from '@/lib/db';

export async function GET() {
  try {
    const users = await getAllUsers();

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'User ID and status are required' },
        { status: 400 }
      );
    }

    if (!['active', 'inactive', 'disabled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const success = await updateUserStatus(userId, status);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'User status updated successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteUser(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
