-- ============================================
-- SMARTLEAVE DATABASE - COMPLETE SETUP
-- ============================================

USE master;
GO

-- Drop database if exists (fresh start)
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'SmartLeaveDB')
BEGIN
    ALTER DATABASE SmartLeaveDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SmartLeaveDB;
END
GO

-- Create fresh database
CREATE DATABASE SmartLeaveDB;
GO

USE SmartLeaveDB;
GO

-- ============================================
-- CREATE TABLES
-- ============================================

-- Departments
CREATE TABLE Departments (
    DepartmentID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(50) NOT NULL UNIQUE,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Employees
CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'Employee',
    Gender NVARCHAR(10) NOT NULL,
    DateOfBirth DATE NOT NULL,
    HireDate DATETIME NOT NULL DEFAULT GETDATE(),
    DepartmentID INT NULL,
    ManagerID INT NULL,
    SupervisorID INT NULL,
    ReportsToID INT NULL,
    RequestedRole NVARCHAR(20) NULL,
    IsApproved BIT NOT NULL DEFAULT 1,
    ApprovedBy INT NULL,
    ApprovedOn DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
    FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (SupervisorID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (ReportsToID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (ApprovedBy) REFERENCES Employees(EmployeeID),
    CHECK (Role IN ('Admin', 'Manager', 'Supervisor', 'Employee')),
    CHECK (Gender IN ('Male', 'Female', 'Other'))
);

-- LeaveTypes
CREATE TABLE LeaveTypes (
    LeaveTypeID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(50) NOT NULL UNIQUE,
    MaxDays INT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    ApplicableToGender NVARCHAR(10) NULL DEFAULT 'All',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- LeaveRequests
CREATE TABLE LeaveRequests (
    LeaveID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Reason NVARCHAR(500) NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    AppliedOn DATETIME NOT NULL DEFAULT GETDATE(),
    SupportingDocumentName NVARCHAR(255) NULL,
    SupportingDocumentPath NVARCHAR(500) NULL,
    LastModified DATETIME NULL,
    ModifiedBy INT NULL,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (LeaveTypeID) REFERENCES LeaveTypes(LeaveTypeID),
    CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    CHECK (EndDate >= StartDate)
);

-- LateArrivals
CREATE TABLE LateArrivals (
    LateID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    Date DATE NOT NULL,
    ExpectedArrival TIME NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    ReportedOn DATETIME NOT NULL DEFAULT GETDATE(),
    PhotoName NVARCHAR(255) NULL,
    PhotoPath NVARCHAR(500) NULL,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CHECK (Status IN ('Pending', 'Reviewed', 'Dismissed'))
);

-- LeaveApprovals
CREATE TABLE LeaveApprovals (
    ApprovalID INT PRIMARY KEY IDENTITY(1,1),
    LeaveRequestID INT NOT NULL,
    ApproverID INT NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    Comment NVARCHAR(255) NULL,
    ApprovedOn DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (LeaveRequestID) REFERENCES LeaveRequests(LeaveID),
    FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID),
    CHECK (Status IN ('Pending', 'Approved', 'Rejected'))
);

-- Notifications
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(500) NOT NULL,
    ReferenceID INT NULL,
    ReferenceType NVARCHAR(20) NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    IsHeard BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ReadAt DATETIME NULL,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
);

-- UserSettings
CREATE TABLE UserSettings (
    SettingID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL UNIQUE,
    MasterSound BIT NOT NULL DEFAULT 1,
    Volume INT NOT NULL DEFAULT 80,
    Vibration BIT NOT NULL DEFAULT 1,
    NotificationDuration INT NOT NULL DEFAULT 60,
    Theme NVARCHAR(20) NOT NULL DEFAULT 'Light',
    DateFormat NVARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',
    DailyDigest BIT NOT NULL DEFAULT 0,
    DigestTime TIME NOT NULL DEFAULT '08:00',
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CHECK (Volume BETWEEN 0 AND 100),
    CHECK (Theme IN ('Light', 'Dark', 'Auto')),
    CHECK (DateFormat IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'))
);

-- Overtimes
CREATE TABLE Overtimes (
    OvertimeID INT PRIMARY KEY IDENTITY(1,1),
    ManagerID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Date DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    MaxSlots INT NOT NULL,
    CurrentSlots INT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Open',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID)
);

-- OvertimeApplications
CREATE TABLE OvertimeApplications (
    ApplicationID INT PRIMARY KEY IDENTITY(1,1),
    OvertimeID INT NOT NULL,
    EmployeeID INT NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    AppliedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ApprovedAt DATETIME NULL,
    Reason NVARCHAR(200) NULL,
    FOREIGN KEY (OvertimeID) REFERENCES Overtimes(OvertimeID),
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IX_Employees_Email ON Employees(Email);
CREATE INDEX IX_Employees_DepartmentID ON Employees(DepartmentID);
CREATE INDEX IX_Employees_ManagerID ON Employees(ManagerID);
CREATE INDEX IX_Employees_SupervisorID ON Employees(SupervisorID);
CREATE INDEX IX_Employees_ReportsToID ON Employees(ReportsToID);
CREATE INDEX IX_Employees_IsApproved ON Employees(IsApproved);
CREATE INDEX IX_Employees_Role ON Employees(Role);

CREATE INDEX IX_LeaveRequests_EmployeeID ON LeaveRequests(EmployeeID);
CREATE INDEX IX_LeaveRequests_LeaveTypeID ON LeaveRequests(LeaveTypeID);
CREATE INDEX IX_LeaveRequests_Status ON LeaveRequests(Status);
CREATE INDEX IX_LeaveRequests_AppliedOn ON LeaveRequests(AppliedOn);
CREATE INDEX IX_LeaveRequests_Dates ON LeaveRequests(StartDate, EndDate);

CREATE INDEX IX_LateArrivals_EmployeeID ON LateArrivals(EmployeeID);
CREATE INDEX IX_LateArrivals_Status ON LateArrivals(Status);
CREATE INDEX IX_LateArrivals_ReportedOn ON LateArrivals(ReportedOn);

CREATE INDEX IX_Notifications_EmployeeID ON Notifications(EmployeeID);
CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);
CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt);
CREATE INDEX IX_Notifications_Type ON Notifications(Type);

CREATE INDEX IX_Overtimes_ManagerID ON Overtimes(ManagerID);
CREATE INDEX IX_Overtimes_Status ON Overtimes(Status);
CREATE INDEX IX_Overtimes_Date ON Overtimes(Date);
CREATE INDEX IX_OvertimeApplications_OvertimeID ON OvertimeApplications(OvertimeID);
CREATE INDEX IX_OvertimeApplications_EmployeeID ON OvertimeApplications(EmployeeID);
CREATE INDEX IX_OvertimeApplications_Status ON OvertimeApplications(Status);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Departments
INSERT INTO Departments (Name) VALUES 
    ('Human Resources'),
    ('Information Technology'),
    ('Finance'),
    ('Sales'),
    ('Operations'),
    ('Marketing'),
    ('Legal');

-- Leave Types
INSERT INTO LeaveTypes (Name, MaxDays, Description, ApplicableToGender) VALUES
    ('Annual', 20, 'Paid annual leave', 'All'),
    ('Sick', 30, 'Sick leave with medical certificate', 'All'),
    ('Family', 10, 'Family responsibility leave', 'All'),
    ('Unpaid', NULL, 'Leave without pay', 'All'),
    ('Maternity', 120, 'Maternity leave for female employees', 'Female'),
    ('Paternity', 10, 'Paternity leave for male employees', 'Male');

-- Default Admin User (password: 12345678910)
DECLARE @ITDeptID INT = (SELECT DepartmentID FROM Departments WHERE Name = 'Information Technology');

INSERT INTO Employees (
    Name, Email, PasswordHash, Role, Gender, DateOfBirth, DepartmentID, IsApproved
)
VALUES (
    'System Administrator',
    'admin@company.com',
    '$2a$11$sw/S9CBsWvoLNT7.Hg.5vO6/9qUAsg.JwOpDu5/FYjbYZzz9KAwnW',
    'Admin',
    'Other',
    '1990-01-01',
    @ITDeptID,
    1
);

-- Create default settings for admin
INSERT INTO UserSettings (EmployeeID) 
SELECT EmployeeID FROM Employees WHERE Email = 'admin@company.com';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ DATABASE CREATED SUCCESSFULLY' AS Status;
SELECT name AS TableName FROM sys.tables ORDER BY name;
SELECT '👤 Admin Login: admin@company.com / 12345678910' AS LoginInfo;
SELECT COUNT(*) AS TotalEmployees FROM Employees;
SELECT COUNT(*) AS TotalDepartments FROM Departments;
SELECT COUNT(*) AS TotalLeaveTypes FROM LeaveTypes;