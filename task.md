
User Account Management & Stock Balance Control
1. OVERVIEW
This feature enables administrators to access comprehensive user account creation data and manage stock balances directly from the admin panel. Admins can view detailed information submitted during user signup, monitor account creation details, and adjust user stock balances manually with a complete audit trail.

2. OBJECTIVES
	•	Provide admins with complete visibility into user account creation data
	•	Enable manual stock balance adjustments with administrative approval
	•	Maintain an audit trail of all stock balance changes
	•	Prevent unauthorized balance modifications through role-based access control
	•	Ensure data integrity and compliance with company policies

3. SCOPE
Included Features
	•	View all user account creation data (KYC info, personal details, signup metadata)
	•	Search and filter users by email, name, account creation date
	•	View current and historical stock balances
	•	Adjust user stock balance with reason/notes
	•	Bulk import stock balance adjustments (CSV)
	•	Complete audit trail with timestamps and admin identification
	•	Export user and balance modification data
Out of Scope
	•	User account deletion or suspension (separate feature)
	•	Password resets or two-factor authentication management
	•	Transaction history modifications

4. USER STORIES
4.1 View User Account Data
As an admin, I want to view complete account creation data for any user so that I can verify their information and identify potential fraud or compliance issues.
Acceptance Criteria:
	•	Admin can search for users by email, full name, or account ID
	•	User detail page displays: full name, email, phone number, address, KYC status, documents, account creation date/time
	•	IP address and user agent information is visible for security auditing
	•	All account creation data is read-only from the admin view

4.2 Adjust Stock Balance
As an admin, I want to manually adjust a user's stock balance to correct discrepancies or distribute promotional credits.
Acceptance Criteria:
	•	Admin can input a new balance amount or adjustment amount
	•	Admin must provide a reason for the adjustment (dropdown + custom notes)
	•	Adjustment is logged with: timestamp, admin name, previous balance, new balance, reason
	•	User receives notification of balance change
	•	Adjustments cannot be deleted (only audit trail is visible)

4.3 View Balance Audit Trail
As an admin, I want to see a complete history of stock balance changes for any user to track modifications and ensure accountability.
Acceptance Criteria:
	•	User profile page shows a Balance History section with a chronological table
	•	Each entry shows: date, previous balance, new balance, change amount, reason, admin who made change
	•	History is filterable by date range and change type
	•	Can export audit trail as CSV

5. TECHNICAL REQUIREMENTS
5.1 Database Schema Changes
Add the following to existing database:
	•	AccountCreationData table to store signup form data and metadata
	•	StockBalanceAudit table to track all balance modifications
	•	Add stockBalance field to User model

5.2 API Endpoints
The following endpoints must be created:
Endpoint
Method
Description
/admin/users
GET
List all users with search/filter
/admin/users/[id]
GET
Get single user with all data
/admin/users/[id]/account-info
GET
Get account creation data
/admin/users/[id]/balance
GET
Get balance and history
/admin/users/[id]/balance
POST
Update user balance
/admin/balance-audit
GET
Get all balance modifications

6. UI COMPONENTS
6.1 User Management Page
Path: /admin/users
Layout:
	•	Search bar at top (search by email, name, account ID)
	•	Filter options: Account status, KYC status, date range
	•	User table with columns: Name, Email, Account Created, KYC Status, Current Balance
	•	Click row to view detailed user page
	•	Export button (CSV/Excel)

6.2 User Detail Page
Path: /admin/users/[userId]
Sections:
	•	User Profile Card: Avatar, name, email, account status
	•	Account Creation Data: All signup form fields (read-only)
	•	Stock Balance Card: Current balance, locked balance, total profit
	•	Adjust Balance Button: Opens modal dialog
	•	Balance Audit Trail: Chronological table of all modifications

6.3 Adjust Balance Modal
Fields:
	•	Current Balance (read-only, displayed at top)
	•	Adjustment Type: Radio buttons (Set To / Add / Subtract)
	•	Amount: Number input with validation
	•	Reason Dropdown: Corrections, Promotion, Refund, Manual Adjustment, Other
	•	Notes: Rich text field (optional, max 500 chars)
	•	Preview: Shows New Balance calculation in real-time
	•	Action Buttons: Submit / Cancel

6.4 Balance Audit Trail Table
Columns:
	•	Date & Time
	•	Previous Balance
	•	New Balance
	•	Change Amount
	•	Reason
	•	Admin Name
	•	Notes
	•	Filters: Date range, change type

7. SECURITY & ACCESS CONTROL
	•	Endpoints must be protected with admin role check
	•	Only users with Admin or Support Admin role can access
	•	All balance modifications logged with admin ID and timestamp
	•	Rate limit: 100 balance adjustments per hour per admin
	•	Input validation: Balance amounts cannot be negative
	•	All API responses encrypted and session-based

8. TIMELINE & DELIVERABLES
Phase 1: Backend Setup (Week 1-2)
	•	Create Prisma schema migrations
	•	Implement API endpoints
	•	Add input validation and error handling
	•	Write API tests

Phase 2: Frontend UI (Week 3-4)
	•	Build user list page with search/filter
	•	Create user detail page
	•	Build adjust balance modal
	•	Implement audit trail table

Phase 3: Testing & Deployment (Week 5)
	•	Integration testing
	•	Security audit
	•	Performance testing
	•	Deploy to staging, then production

9. SUCCESS METRICS
	•	100% of balance adjustments logged with audit trail
	•	Admin can search users and view data within 2 seconds
	•	Balance adjustments processed with <500ms latency
	•	Zero unauthorized balance modifications
	•	Admin satisfaction: >4.5/5 usability rating


the admin sidebar still looks like client side which is wrong. i give you permission to do what is right, but follow the prd as well