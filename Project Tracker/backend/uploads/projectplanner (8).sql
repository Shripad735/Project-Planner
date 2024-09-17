-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 02, 2024 at 06:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `projectplanner`
--

-- --------------------------------------------------------

--
-- Table structure for table `completionproofs`
--

CREATE TABLE `completionproofs` (
  `ProofID` int(11) NOT NULL,
  `TaskID` int(11) NOT NULL,
  `SubmissionAt` datetime NOT NULL DEFAULT current_timestamp(),
  `ProofFile` varchar(255) NOT NULL,
  `Status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `completionproofs`
--
DELIMITER $$
CREATE TRIGGER `after_proof_approved_update_task_status` AFTER UPDATE ON `completionproofs` FOR EACH ROW BEGIN
    IF NEW.Status = 'approved' THEN
        UPDATE tasks
        SET Status = 'Completed'
        WHERE TaskID = NEW.TaskID;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_proof_insert_notify_task_maker` AFTER INSERT ON `completionproofs` FOR EACH ROW BEGIN

    -- Insert a record into NotificationsSent
    INSERT INTO NotificationsSent (taskid, userid, notn, viewed, sentat)
    VALUES (NEW.TaskID, (SELECT CreatedBy from projects p INNER JOIN milestones m on p.ProjectID = m.ProjectID INNER JOIN Tasks t on t.MilestoneID=m.MilestoneID WHERE TaskID = NEW.TaskID), 4, FALSE, NOW());
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_proof_update_notify` AFTER UPDATE ON `completionproofs` FOR EACH ROW BEGIN

    -- Handle task approval
    IF NEW.Status = 'Approved' AND OLD.Status != 'Approved' THEN
        -- Update the task status to 'Completed'
        UPDATE Tasks
        SET Status = 'Completed'
        WHERE TaskID = NEW.TaskID;

        -- Insert a record into NotificationsSent
        INSERT INTO NotificationsSent (taskid, userid, notn, viewed, sentat)
        VALUES (NEW.TaskID, (SELECT AssignedTo FROM Tasks WHERE TaskID = NEW.TaskID), 2, FALSE, NOW());

    -- Handle task rejection
    ELSEIF NEW.Status = 'Rejected' AND OLD.Status != 'Rejected' THEN

        -- Insert a record into NotificationsSent
        INSERT INTO NotificationsSent (taskid, userid, notn, viewed, sentat)
        VALUES (NEW.TaskID, (SELECT AssignedTo FROM Tasks WHERE TaskID = NEW.TaskID), 3, FALSE, NOW());
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_proof_insert` BEFORE INSERT ON `completionproofs` FOR EACH ROW BEGIN
    DECLARE task_status VARCHAR(20);

    -- Retrieve the status of the associated task
    SELECT Status INTO task_status 
    FROM tasks 
    WHERE TaskID = NEW.TaskID;

    -- Check if the task status is 'Not Started'
    IF task_status = 'Not Started' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot accept a proof of completion for a task that has not been started';
    END IF;
    
    -- Check if the task status is 'Completed'
    IF task_status = 'Not Started' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot accept a proof of completion for an already completed task';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `milestones`
--

CREATE TABLE `milestones` (
  `MilestoneID` int(11) NOT NULL,
  `ProjectID` int(11) NOT NULL,
  `Seq` int(11) DEFAULT NULL,
  `MilestoneName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  `Status` enum('Not Started','In Progress','Completed','Overdue') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notid` int(11) NOT NULL,
  `message` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notid`, `message`) VALUES
(1, 'New task has been assigned to you.'),
(2, 'Your submitted task has been verified as completed.'),
(3, 'Your submitted task has been verified as not completed. So the submission is rejected.'),
(4, 'A submitted task is pending for verification.'),
(5, 'A task assigned to you is overdue. Try to complete it as soon as possible.'),
(6, 'A task assigned to you has started accepting submissions today. Finish it as early as possible.'),
(7, 'A task assigned to you is due after 3 days. Try to complete it as early as possible.');

-- --------------------------------------------------------

--
-- Table structure for table `notificationssent`
--

CREATE TABLE `notificationssent` (
  `notnid` int(11) NOT NULL,
  `taskid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `notn` int(11) NOT NULL,
  `Description` text NOT NULL,
  `viewed` tinyint(1) NOT NULL DEFAULT 0,
  `sentat` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `otps`
--

CREATE TABLE `otps` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `createdAt` datetime NOT NULL,
  `expiresAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `ProjectID` int(11) NOT NULL,
  `ProjectName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  `CreatedBy` int(11) NOT NULL,
  `Status` enum('Not Started','In Progress','Completed','Overdue') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `projects`
--
DELIMITER $$
CREATE TRIGGER `verify_project_startdate_insert` BEFORE INSERT ON `projects` FOR EACH ROW BEGIN
    IF NEW.StartDate < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Start date must be current or future date';
    END IF;

    IF NEW.EndDate <= NEW.StartDate THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'End date must be at least one day after start date';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `verify_project_startdate_update` BEFORE UPDATE ON `projects` FOR EACH ROW BEGIN
    IF NEW.StartDate != OLD.StartDate THEN
        IF NEW.StartDate < CURDATE() THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Start date must be current or future date';
        END IF;
    END IF;

    IF NEW.EndDate != OLD.EndDate OR NEW.StartDate != OLD.StartDate THEN
        IF NEW.EndDate <= NEW.StartDate THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'End date must be at least one day after start date';
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `projectstatusupdates`
--

CREATE TABLE `projectstatusupdates` (
  `ProjectID` int(11) NOT NULL,
  `Status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `TaskID` int(11) NOT NULL,
  `MilestoneID` int(11) NOT NULL,
  `Seq` int(11) DEFAULT NULL,
  `TaskName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `AssignedTo` int(11) NOT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  `Status` enum('Not Started','In Progress','Completed','Overdue') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `tasks`
--
DELIMITER $$
CREATE TRIGGER `after_task_insert_notify` AFTER INSERT ON `tasks` FOR EACH ROW BEGIN
    INSERT INTO NotificationsSent (notnid, taskid, userid, notn, viewed, sentat)
    VALUES (NULL, NEW.taskid, NEW.assignedto, 1, FALSE, NOW());
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_task_update_notify_status` AFTER UPDATE ON `tasks` FOR EACH ROW BEGIN
    IF NEW.Status = 'In Progress' AND OLD.Status = 'Not Started' THEN
        INSERT INTO NotificationsSent (taskid, userid, notn, viewed, sentat)
        VALUES (NEW.TaskID, NEW.AssignedTo, 6, FALSE, NOW());
    END IF;

    IF NEW.Status = 'Overdue' AND OLD.Status != 'Overdue' THEN
        INSERT INTO NotificationsSent (taskid, userid, notn, viewed, sentat)
        VALUES (NEW.TaskID, NEW.AssignedTo, 5, FALSE, NOW());
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_task_due_reminder` BEFORE UPDATE ON `tasks` FOR EACH ROW BEGIN
    DECLARE reminderDate DATE;
    SET reminderDate = DATE_SUB(NEW.EndDate, INTERVAL 3 DAY);

    IF NEW.Status != 'Completed' AND reminderDate = CURDATE() THEN
        INSERT INTO NotificationsSent (taskid, userid, notn, viewed, sentat)
        VALUES (NEW.TaskID, NEW.AssignedTo, 7, FALSE, NOW());
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `check_taskassignedto_user` BEFORE INSERT ON `tasks` FOR EACH ROW BEGIN
    DECLARE userType INT;
    SELECT UserType INTO userType FROM Users WHERE UserID = NEW.AssignedTo;
    IF userType != 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot assign the task to this user';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `check_taskassignedto_user_up` BEFORE UPDATE ON `tasks` FOR EACH ROW BEGIN
    DECLARE userType INT;
    SELECT UserType INTO userType FROM Users WHERE UserID = NEW.AssignedTo;
    IF userType != 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot assign the task to this user';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Username` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(100) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `UserType` int(11) NOT NULL DEFAULT 2
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `Username`, `Email`, `Password`, `Name`, `UserType`) VALUES
(1, 'ParthK', 'parth.kulkarni@mitaoe.ac.in', 'cb53d67a5193ab2510bcff5da8cf0b2a', 'Parth Kulkarni', 1),
(2, 'Utkarsh', 'utkarshkulkarni@gmail.com', '836bb04de698e84f5229dee6d9b9c9ec', 'Utkarsh Kulkarni', 2),
(3, 'RajSharma', 'rajsharma@yahoo.com', 'f8d53959da9bc156492d1a3f66e5c9d1', 'Raj Sharma', 1),
(4, 'Sakshi', 'sakshi@outlook.com', '2b74f124d93d105484bd00f8556fb0ee', 'Sakshi Inamdar', 2),
(5, 'OmPawar', 'ompawar@gmail.com', '3c5645f08b8cc70757d24ae31d88821e', 'Om', 2),
(7, 'Dhanwantari25', 'dhanwantari@gmail.com', 'e4594f676ca824a7a58fb62535be5100', 'Dhanwantari', 1),
(8, 'ShripadK', 'shripad@gmail.com', '827ccb0eea8a706c4c34a16891f84e7b', 'Shripad Khandare', 2);

-- --------------------------------------------------------

--
-- Table structure for table `usertypes`
--

CREATE TABLE `usertypes` (
  `UserTypeID` int(11) NOT NULL,
  `UserType` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usertypes`
--

INSERT INTO `usertypes` (`UserTypeID`, `UserType`) VALUES
(1, 'Task maker'),
(2, 'Task completer');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `completionproofs`
--
ALTER TABLE `completionproofs`
  ADD PRIMARY KEY (`ProofID`),
  ADD KEY `TaskID` (`TaskID`);

--
-- Indexes for table `milestones`
--
ALTER TABLE `milestones`
  ADD PRIMARY KEY (`MilestoneID`),
  ADD KEY `ProjectID` (`ProjectID`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notid`);

--
-- Indexes for table `notificationssent`
--
ALTER TABLE `notificationssent`
  ADD PRIMARY KEY (`notnid`),
  ADD KEY `taskid` (`taskid`),
  ADD KEY `userid` (`userid`),
  ADD KEY `notn` (`notn`);

--
-- Indexes for table `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`ProjectID`),
  ADD KEY `Created_by` (`CreatedBy`);

--
-- Indexes for table `projectstatusupdates`
--
ALTER TABLE `projectstatusupdates`
  ADD PRIMARY KEY (`ProjectID`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`TaskID`),
  ADD KEY `MilestoneID` (`MilestoneID`),
  ADD KEY `fk_assignedto` (`AssignedTo`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `User_unique` (`Username`,`Email`),
  ADD KEY `UserType` (`UserType`);

--
-- Indexes for table `usertypes`
--
ALTER TABLE `usertypes`
  ADD PRIMARY KEY (`UserTypeID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `completionproofs`
--
ALTER TABLE `completionproofs`
  MODIFY `ProofID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `milestones`
--
ALTER TABLE `milestones`
  MODIFY `MilestoneID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `notificationssent`
--
ALTER TABLE `notificationssent`
  MODIFY `notnid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `ProjectID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `TaskID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `usertypes`
--
ALTER TABLE `usertypes`
  MODIFY `UserTypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `completionproofs`
--
ALTER TABLE `completionproofs`
  ADD CONSTRAINT `completionproofs_ibfk_1` FOREIGN KEY (`TaskID`) REFERENCES `tasks` (`TaskID`) ON DELETE CASCADE;

--
-- Constraints for table `milestones`
--
ALTER TABLE `milestones`
  ADD CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`ProjectID`) REFERENCES `projects` (`ProjectID`);

--
-- Constraints for table `notificationssent`
--
ALTER TABLE `notificationssent`
  ADD CONSTRAINT `notificationssent_ibfk_1` FOREIGN KEY (`taskid`) REFERENCES `tasks` (`TaskID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notificationssent_ibfk_2` FOREIGN KEY (`userid`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notificationssent_ibfk_3` FOREIGN KEY (`notn`) REFERENCES `notifications` (`notid`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_assignedto` FOREIGN KEY (`AssignedTo`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`MilestoneID`) REFERENCES `milestones` (`MilestoneID`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`AssignedTo`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`AssignedTo`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_4` FOREIGN KEY (`AssignedTo`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`UserType`) REFERENCES `usertypes` (`UserTypeID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
