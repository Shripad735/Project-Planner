import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import '../styles/TaskForm.css';
import Cookies from 'js-cookie';

const TaskForm = ({ milestoneName, onAddTask, projectStartDate, projectEndDate }) => {
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const startDate = watch('startDate', '');
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const onSubmit = (data) => {
    onAddTask(milestoneName, data);
    reset();
  };

  const handleEmailInputChange = (e) => {
    const { value } = e.target;

    if (value.length > 0) {
      fetch(`http://localhost:3000/emails?q=${value}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('data:', data);
        setEmailSuggestions(data);
        setShowSuggestions(true);
      })
      .catch(error => {
        console.error('Error fetching email suggestions:', error);
      });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleEmailSuggestionClick = (email) => {
    setValue('assignedTo', email); // Update input value with the selected email
    setShowSuggestions(false); // Hide suggestions after selecting
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="task-form">
      <input name="name" placeholder="Task Name" {...register('name', { required: true })} />
      <input name="description" placeholder="Task Description" {...register('description')} />
      <input type="date" name="startDate" {...register('startDate', { required: true })} min={projectStartDate || today} max={projectEndDate} />
      <input type="date" name="endDate" {...register('endDate', { required: true })} min={startDate || projectStartDate || today} max={projectEndDate} />

      <input
        name="assignedTo"
        placeholder="Start typing to see suggestions"
        onChange={handleEmailInputChange}
        {...register('assignedTo', { required: true })}
        list="email-options"
      />
      {showSuggestions && (
        <div className="email-suggestions">
          {emailSuggestions.map((email, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleEmailSuggestionClick(email)}
            >
              {email}
            </div>
          ))}
        </div>
      )}

      <button type="submit">Add Task</button>
    </form>
  );
};

export default TaskForm;
