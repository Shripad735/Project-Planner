-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 08, 2024 at 02:30 PM
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

--
-- Dumping data for table `milestones`
--

INSERT INTO `milestones` (`MilestoneID`, `ProjectID`, `Seq`, `MilestoneName`, `Description`, `StartDate`, `EndDate`, `Status`) VALUES
(1, 1, NULL, 'Database', 'Create tables ', '2024-07-15', '2024-07-19', 'Not Started'),
(9, 2, NULL, 'Data collection', 'abc', '2024-08-10', '2024-08-14', 'Not Started');

--
-- Triggers `milestones`
--
DELIMITER $$
CREATE TRIGGER `after_milestone_delete_update_project_status` AFTER DELETE ON `milestones` FOR EACH ROW BEGIN
    DECLARE total_milestones INT;
    DECLARE not_started_milestones INT;
    DECLARE in_progress_milestones INT;
    DECLARE completed_milestones INT;
    
    -- Count total milestones and their respective statuses for the project
    SELECT COUNT(*), 
           COUNT(CASE WHEN Status = 'Not Started' THEN 1 END),
           COUNT(CASE WHEN Status = 'In Progress' THEN 1 END),
           COUNT(CASE WHEN Status = 'Completed' THEN 1 END)
    INTO total_milestones, not_started_milestones, in_progress_milestones, completed_milestones
    FROM Milestones
    WHERE ProjectID = OLD.ProjectID;

    -- Set project status based on milestone statuses
    IF completed_milestones = total_milestones THEN
        UPDATE Projects
        SET Status = 'Completed'
        WHERE ProjectID = OLD.ProjectID;
    ELSEIF not_started_milestones = total_milestones THEN
        UPDATE Projects
        SET Status = 'Not Started'
        WHERE ProjectID = OLD.ProjectID;
    ELSE
        UPDATE Projects
        SET Status = 'In Progress'
        WHERE ProjectID = OLD.ProjectID;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_milestone_insert_update_project_status` AFTER INSERT ON `milestones` FOR EACH ROW BEGIN
    DECLARE total_milestones INT;
    DECLARE not_started_milestones INT;
    DECLARE in_progress_milestones INT;
    DECLARE completed_milestones INT;
    
    -- Count total milestones and their respective statuses for the project
    SELECT COUNT(*), 
           COUNT(CASE WHEN Status = 'Not Started' THEN 1 END),
           COUNT(CASE WHEN Status = 'In Progress' THEN 1 END),
           COUNT(CASE WHEN Status = 'Completed' THEN 1 END)
    INTO total_milestones, not_started_milestones, in_progress_milestones, completed_milestones
    FROM Milestones
    WHERE ProjectID = NEW.ProjectID;

    -- Set project status based on milestone statuses
    IF completed_milestones = total_milestones THEN
        UPDATE Projects
        SET Status = 'Completed'
        WHERE ProjectID = NEW.ProjectID;
    ELSEIF not_started_milestones = total_milestones THEN
        UPDATE Projects
        SET Status = 'Not Started'
        WHERE ProjectID = NEW.ProjectID;
    ELSE
        UPDATE Projects
        SET Status = 'In Progress'
        WHERE ProjectID = NEW.ProjectID;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_milestone_update_update_project_status` AFTER UPDATE ON `milestones` FOR EACH ROW BEGIN
    DECLARE total_milestones INT;
    DECLARE not_started_milestones INT;
    DECLARE in_progress_milestones INT;
    DECLARE completed_milestones INT;
    
    -- Count total milestones and their respective statuses for the project
    SELECT COUNT(*), 
           COUNT(CASE WHEN Status = 'Not Started' THEN 1 END),
           COUNT(CASE WHEN Status = 'In Progress' THEN 1 END),
           COUNT(CASE WHEN Status = 'Completed' THEN 1 END)
    INTO total_milestones, not_started_milestones, in_progress_milestones, completed_milestones
    FROM Milestones
    WHERE ProjectID = NEW.ProjectID;

    -- Set project status based on milestone statuses
    IF completed_milestones = total_milestones THEN
        UPDATE Projects
        SET Status = 'Completed'
        WHERE ProjectID = NEW.ProjectID;
    ELSEIF not_started_milestones = total_milestones THEN
        UPDATE Projects
        SET Status = 'Not Started'
        WHERE ProjectID = NEW.ProjectID;
    ELSE
        UPDATE Projects
        SET Status = 'In Progress'
        WHERE ProjectID = NEW.ProjectID;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `check_milestonestatus_insert` AFTER INSERT ON `milestones` FOR EACH ROW BEGIN
    -- If a single milestone is in progress, set the project status to 'In Progress'
    IF NEW.Status = 'In Progress' THEN
        UPDATE Projects
        SET Status = 'In Progress'
        WHERE ProjectID = NEW.ProjectID;
    END IF;

    -- If all milestones are completed, set the project status to 'Completed'
    IF (SELECT COUNT(*) FROM Milestones WHERE ProjectID = NEW.ProjectID AND Status != 'Completed') = 0 THEN
        UPDATE Projects
        SET Status = 'Completed'
        WHERE ProjectID = NEW.ProjectID;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `check_milestonestatus_update` AFTER UPDATE ON `milestones` FOR EACH ROW BEGIN
    -- If a single milestone is in progress, set the project status to 'In Progress'
    IF NEW.Status = 'In Progress' THEN
        UPDATE Projects
        SET Status = 'In Progress'
        WHERE ProjectID = NEW.ProjectID;
    END IF;

    -- If all milestones are completed, set the project status to 'Completed'
    IF (SELECT COUNT(*) FROM Milestones WHERE ProjectID = NEW.ProjectID AND Status != 'Completed') = 0 THEN
        UPDATE Projects
        SET Status = 'Completed'
        WHERE ProjectID = NEW.ProjectID;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `onmiledelete_update_project_enddate` AFTER DELETE ON `milestones` FOR EACH ROW BEGIN
    UPDATE Projects
    SET EndDate = (
        SELECT MAX(EndDate)
        FROM Milestones
        WHERE ProjectID = OLD.ProjectID
    )
    WHERE ProjectID = OLD.ProjectID;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `onmileinsert_update_project_enddate` AFTER INSERT ON `milestones` FOR EACH ROW BEGIN
    UPDATE Projects
    SET EndDate = (
        SELECT MAX(EndDate)
        FROM Milestones
        WHERE ProjectID = NEW.ProjectID
    )
    WHERE ProjectID = NEW.ProjectID;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `onmileupdate_update_project_enddate` AFTER UPDATE ON `milestones` FOR EACH ROW BEGIN
    UPDATE Projects
    SET EndDate = (
        SELECT MAX(EndDate)
        FROM Milestones
        WHERE ProjectID = NEW.ProjectID
    )
    WHERE ProjectID = NEW.ProjectID;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `verify_milestone_startdate_insert` BEFORE INSERT ON `milestones` FOR EACH ROW BEGIN
    DECLARE projectStartDate DATE;
    SELECT StartDate INTO projectStartDate FROM Projects WHERE ProjectID = NEW.ProjectID;

    IF NEW.StartDate < projectStartDate THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Milestone start date must be on or after the project start date';
    END IF;

    IF NEW.EndDate <= NEW.StartDate THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Milestone end date must be after the start date';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `verify_milestone_startdate_update` BEFORE UPDATE ON `milestones` FOR EACH ROW BEGIN
    DECLARE projectStartDate DATE;
    SELECT StartDate INTO projectStartDate FROM Projects WHERE ProjectID = NEW.ProjectID;

    IF NEW.StartDate != OLD.StartDate THEN
        IF NEW.StartDate < projectStartDate THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Milestone start date must be on or after the project start date';
        END IF;
    END IF;

    IF NEW.EndDate != OLD.EndDate OR NEW.StartDate != OLD.StartDate THEN
        IF NEW.EndDate <= NEW.StartDate THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Milestone end date must be after the start date';
        END IF;
    END IF;
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `milestones`
--
ALTER TABLE `milestones`
  ADD PRIMARY KEY (`MilestoneID`),
  ADD KEY `ProjectID` (`ProjectID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `milestones`
--
ALTER TABLE `milestones`
  MODIFY `MilestoneID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `milestones`
--
ALTER TABLE `milestones`
  ADD CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`ProjectID`) REFERENCES `projects` (`ProjectID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
