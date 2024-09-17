import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";
import "../styles/EditProjectDetails.css";

const EditProjectDetails = () => {
  const { projectname } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRefs = useRef({}); // Create a ref to store input refs dynamically

  useEffect(() => {
    fetch(`http://localhost:3000/project/${projectname}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("No project found");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Project Data:", data);

        let SD = new Date(data.StartDate);
        SD.setDate(SD.getDate() + 1); // Add 2 days
        let formattedStartDate = SD.toISOString().split("T")[0]; // Format to 'YYYY-MM-DD'

        let ED = new Date(data.StartDate);
        ED.setDate(ED.getDate() + 1); // Add 2 days
        let formattedEndDate = ED.toISOString().split("T")[0]; // Format to 'YYYY-MM-DD'

        setProject({
          ...data,
          StartDate: formattedStartDate,
          EndDate: formattedEndDate,
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching project details:", error);
        setError(error);
        setLoading(false);
      });
  }, [projectname]);

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    setProject((prevProject) => ({ ...prevProject, [field]: value }));
  };

  const handleMilestoneChange = (e, milestoneId, field) => {
    const { value } = e.target;
    setProject((prevProject) => ({
      ...prevProject,
      milestones: prevProject.milestones.map((milestone) =>
        milestone.MilestoneID === milestoneId
          ? { ...milestone, [field]: value }
          : milestone
      ),
    }));
  };

  const handleTaskChange = (e, milestoneId, taskId, field) => {
    const { value } = e.target;
    setProject((prevProject) => ({
      ...prevProject,
      milestones: prevProject.milestones.map((milestone) =>
        milestone.MilestoneID === milestoneId
          ? {
              ...milestone,
              tasks: milestone.tasks.map((task) =>
                task.TaskID === taskId ? { ...task, [field]: value } : task
              ),
            }
          : milestone
      ),
    }));
  };

  const handleAddMilestone = () => {
    const newMilestone = {
      MilestoneID: "New",
      MilestoneName: "",
      description: "",
      StartDate: "",
      EndDate: "",
      Status: "Not Started",
      tasks: [],
    };
    setProject((prevProject) => ({
      ...prevProject,
      milestones: [...(prevProject.milestones || []), newMilestone],
    }));
  };

  const handleDeleteMilestone = (milestoneId) => {
    setProject((prevProject) => ({
      ...prevProject,
      milestones: prevProject.milestones.filter(
        (milestone) => milestone.MilestoneID !== milestoneId
      ),
    }));
  };

  const handleAddTask = (milestoneId) => {
    const newTask = {
      TaskID: "New", // Temporary ID, replace with proper ID after saving to backend
      TaskName: "",
      Description: "",
      AssignedTo: "",
      StartDate: "",
      EndDate: "",
      Status: "Not Started",
    };
    setProject((prevProject) => ({
      ...prevProject,
      milestones: prevProject.milestones.map((milestone) =>
        milestone.MilestoneID === milestoneId
          ? {
              ...milestone,
              tasks: [...milestone.tasks, newTask],
            }
          : milestone
      ),
    }));
  };

  const handleDeleteTask = (milestoneId, taskId) => {
    setProject((prevProject) => ({
      ...prevProject,
      milestones: prevProject.milestones.map((milestone) =>
        milestone.MilestoneID === milestoneId
          ? {
              ...milestone,
              tasks: (milestone.tasks || []).filter(
                (task) => task.TaskID !== taskId
              ),
            }
          : milestone
      ),
    }));
  };

  // Helper function to add 1 day to a date string
  const addOneDay = (dateString) => {
    if (!dateString) return null; // Handle cases where the date might be null or undefined
    let date = new Date(dateString);
    date.setDate(date.getDate() + 1); // Add 1 day
    return date.toISOString().split("T")[0]; // Return in 'YYYY-MM-DD' format
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct the payload for the new endpoint
    const payload = {
      projectID: project.ProjectID,
      projectName: project.ProjectName,
      startDate: project.StartDate,
      endDate: project.EndDate,
      milestones: (project.milestones || []).map((milestone) => ({
        milestoneid: milestone.MilestoneID,
        name: milestone.MilestoneName,
        description: milestone.Description,
        startDate: addOneDay(milestone.StartDate),
        endDate: addOneDay(milestone.EndDate),
        tasks: (milestone.tasks || []).map((task) => ({
          taskid: task.TaskID,
          name: task.TaskName,
          description: task.Description,
          assignedTo: task.AssignedTo,
          startDate: addOneDay(task.StartDate),
          endDate: addOneDay(task.EndDate),
        })),
      })),
    };
    console.log("Payload: ", payload);

    // Send the payload to the new endpoint
    fetch(`http://localhost:3000/projects/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        console.log(response);
        if (!response.ok) {
          throw new Error("Error inserting milestones and tasks");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Milestones and tasks added successfully:", data);
        setProject((prevProject) => ({
          ...prevProject,
          milestones: data.milestones,
        }));

        alert("Project updated successfully!");
      })
      .catch((error) => {
        console.error("Error inserting milestones and tasks:", error);
        setError(error);
      });
  };

  const handleEmailInputChange = (e, milestoneId, taskId) => {
    const { value } = e.target;
    fetch(`http://localhost:3000/emails?q=${value}`, {
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setEmailSuggestions(data);
        setShowSuggestions(true);
      })
      .catch((error) => {
        console.error("Error fetching email suggestions:", error);
      });

    handleTaskChange(e, milestoneId, taskId, "AssignedTo");
  };

  const EmailSuggestions = ({ suggestions, onSuggestionClick, inputRef }) => {
    return (
      <ul className="suggestions-list">
        {suggestions.map((email) => (
          <li key={email} onClick={() => onSuggestionClick(email, inputRef)}>
            {email}
          </li>
        ))}
      </ul>
    );
  };

  const handleEmailSuggestionClick = (email, milestoneId, taskId, inputRef) => {
    setProject((prevProject) => ({
      ...prevProject,
      milestones: prevProject.milestones.map((milestone) =>
        milestone.MilestoneID === milestoneId
          ? {
              ...milestone,
              tasks: milestone.tasks.map((task) =>
                task.TaskID === taskId ? { ...task, AssignedTo: email } : task
              ),
            }
          : milestone
      ),
    }));
    setShowSuggestions(false);
    if (inputRef) {
      inputRef.value = email; // Update the input field with the selected email
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!project) {
    return <div>No project found</div>;
  }

  return (
    <div className="edit-project-details-container p-6 bg-gray-100 min-h-screen w-full h-full">
      <h1 className="text-2xl font-semibold mb-4">
        Edit Project: {project.ProjectName}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-gray-700">Project Name:</label>
          <input
            type="text"
            value={project.ProjectName}
            onChange={(e) => handleInputChange(e, "ProjectName")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Description:</label>
          <input
            type="text"
            value={project.Description}
            onChange={(e) => handleInputChange(e, "Description")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Start Date:</label>
          <input
            type="date"
            value={project.StartDate}
            onChange={(e) => handleInputChange(e, "StartDate")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">End Date:</label>
          <input
            type="date"
            value={project.EndDate}
            onChange={(e) => handleInputChange(e, "EndDate")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <h3 className="text-xl font-semibold mb-4">Milestones</h3>

        {(project.milestones || []).map((milestone) => (
          <div
            key={milestone.MilestoneID}
            className="milestone mb-6 p-4 bg-white rounded-lg shadow-md"
          >
            <div className="milestone-header flex items-center justify-between mb-4">
              <input
                type="text"
                value={milestone.MilestoneName}
                onChange={(e) =>
                  handleMilestoneChange(
                    e,
                    milestone.MilestoneID,
                    "MilestoneName"
                  )
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={() => handleDeleteMilestone(milestone.MilestoneID)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Description:</label>
              <input
                type="text"
                value={milestone.Description}
                onChange={(e) =>
                  handleMilestoneChange(e, milestone.MilestoneID, "Description")
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Start Date:</label>
              <input
                type="date"
                value={addOneDay(milestone.StartDate)}
                onChange={(e) =>
                  handleMilestoneChange(e, milestone.MilestoneID, "StartDate")
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">End Date:</label>
              <input
                type="date"
                value={addOneDay(milestone.EndDate)}
                onChange={(e) =>
                  handleMilestoneChange(e, milestone.MilestoneID, "EndDate")
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <h4 className="text-lg font-semibold mb-4">Tasks</h4>
            {(milestone.tasks || []).map((task) => (
              <div
                key={task.TaskID}
                className="task mb-4 p-4 bg-gray-50 rounded-lg shadow-sm"
              >
                <div className="task-header flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={task.TaskName}
                    onChange={(e) =>
                      handleTaskChange(
                        e,
                        milestone.MilestoneID,
                        task.TaskID,
                        "TaskName"
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteTask(milestone.MilestoneID, task.TaskID)
                    }
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Description:</label>
                  <input
                    type="text"
                    value={task.Description}
                    onChange={(e) =>
                      handleTaskChange(
                        e,
                        milestone.MilestoneID,
                        task.TaskID,
                        "Description"
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Assigned To:</label>
                  <input
                    type="text"
                    value={task.AssignedTo}
                    onChange={(e) =>
                      handleEmailInputChange(
                        e,
                        milestone.MilestoneID,
                        task.TaskID
                      )
                    }
                    ref={(el) => (inputRefs.current[task.TaskID] = el)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  {showSuggestions && emailSuggestions.length > 0 && (
                    <EmailSuggestions
                      suggestions={emailSuggestions}
                      onSuggestionClick={(email, inputRef) =>
                        handleEmailSuggestionClick(
                          email,
                          milestone.MilestoneID,
                          task.TaskID,
                          inputRef
                        )
                      }
                      inputRef={inputRefs.current[task.TaskID]}
                    />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Start Date:</label>
                  <input
                    type="date"
                    value={addOneDay(task.StartDate)}
                    onChange={(e) =>
                      handleTaskChange(
                        e,
                        milestone.MilestoneID,
                        task.TaskID,
                        "StartDate"
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">End Date:</label>
                  <input
                    type="date"
                    value={addOneDay(task.EndDate)}
                    onChange={(e) =>
                      handleTaskChange(
                        e,
                        milestone.MilestoneID,
                        task.TaskID,
                        "EndDate"
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddTask(milestone.MilestoneID)}
              className="add-task-button w-1/3 mx-auto py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex justify-center"
            >
              Add Task
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddMilestone}
          className="add-milestone-button w-1/3 mx-auto py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex justify-center"
        >
          Add Milestone
        </button>
        <button
          type="submit"
          className="save-button w-1/3 mx-auto py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 flex justify-center"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProjectDetails;
