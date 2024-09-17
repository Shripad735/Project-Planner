import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { FaArrowLeft } from "react-icons/fa";
import "../styles/UploadProof.css";

const UploadProof = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedTaskName, setSelectedTaskName] = useState("");
  const [userId, setUserId] = useState(null);
  const [selectedTaskEndDate, setSelectedTaskEndDate] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const setTimeLine = (date) => {
    if (date) {
      const endDate = new Date(date);
      const currentDate = new Date();
      const timeDiff = endDate - currentDate;

      if (timeDiff < 0) {
        const daysOverdue = Math.floor(
          Math.abs(timeDiff) / (1000 * 60 * 60 * 24)
        );
        const hoursOverdue = Math.floor(
          (Math.abs(timeDiff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        setTimeLeft(`Overdue by ${daysOverdue} days and ${hoursOverdue} hours`);
      } else {
        const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor(
          (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        setTimeLeft(`${daysLeft} days and ${hoursLeft} hours left`);
      }
    } else {
      setTimeLeft("");
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.usertype !== 2) {
        alert("Please login again, for usertype confirmation");
        Cookies.remove("token");
        navigate("/login");
        return;
      }

      if (decoded.exp < currentTime) {
        alert("Session expired. Please login again.");
        Cookies.remove("token");
        navigate("/login");
        return;
      } else if (decoded.username !== username) {
        navigate("/login");
        return;
      }

      setUserId(decoded.id);
      fetchTasks(decoded.id);
    } catch (err) {
      navigate("/login");
    }

    const query = new URLSearchParams(window.location.search);
    const taskId = query.get("wwtm");
    const taskName = query.get("rtmn");
    const taskDueDate = query.get("tynr");

    setSelectedTaskId(atob(taskId || ""));
    setSelectedTaskName(atob(taskName || ""));
    setSelectedTaskEndDate(atob(taskDueDate || ""));
    setTimeLine(atob(taskDueDate));
  }, [username, navigate]);

  const fetchTasks = async (userId) => {
    try {
      const response = await fetch("http://localhost:3000/tasks", {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      const tasks = await response.json();
      setTasks(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleBackClick = () => {
    navigate(`/dashboard/${username}`);
  };

  const handleTaskChange = (e) => {
    const selectedTaskId = e.target.value;
    setSelectedTaskId(selectedTaskId);
    const selectedTaskEndDate = e.target.selectedOptions[0].dataset.duedate;
    setSelectedTaskEndDate(selectedTaskEndDate);
    setTimeLine(selectedTaskEndDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !selectedTaskId) {
      alert("Please select a file and a task.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", selectedTaskId);
    formData.append("userId", userId);

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert("File uploaded successfully");
        navigate(`/dashboard/${username}`);
      } else {
        alert(result.message || "File upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  return (
    <div className="wrapper p-6 bg-gray-100 min-h-screen">
      <div
        className="back-arrow cursor-pointer mb-4 text-blue-500"
        onClick={handleBackClick}
      >
        <FaArrowLeft size={30} />
      </div>
      <div className="upload-proof bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">
          Upload Completion Proof{" "}
          {selectedTaskName && `for ${selectedTaskName}`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            required
            className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          />
          <select
            value={selectedTaskId}
            onChange={handleTaskChange}
            required
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="" className="taskName">
              Select Task
            </option>
            {tasks.map((task) => (
              <option
                key={task.TaskId}
                value={task.TaskId}
                data-duedate={task.EndDate}
              >
                {task.TaskName}
              </option>
            ))}
          </select>
          {selectedTaskEndDate && (
            <>
              <p>
                <b>Due Date:</b>{" "}
                {new Date(selectedTaskEndDate).toLocaleString()}
              </p>
              <p
                style={{
                  color: new Date(selectedTaskEndDate) < new Date() ? "red" : "green",
                }}
              >
                <b>Time Left:</b> {timeLeft}
              </p>
            </>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadProof;