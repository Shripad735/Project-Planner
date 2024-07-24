import React from 'react';
import { useForm } from 'react-hook-form';
import '../styles/TaskForm.css';

const TaskForm = ({ milestoneName, onAddTask, projectStartDate, projectEndDate }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  const startDate = watch('startDate', ''); // Watch the startDate field

  const onSubmit = (data) => {
    onAddTask(milestoneName, data);
    reset();
  };

  const today = new Date().toISOString().split('T')[0]; // Get today's date in yyyy-mm-dd format

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="task-form">
      <input name="name" placeholder="Task Name" {...register('name', { required: true })} />
      <input name="description" placeholder="Task Description" {...register('description')} />
      <input type="date" name="startDate" {...register('startDate', { required: true })} min={projectStartDate || today} max={projectEndDate} />
      <input type="date" name="endDate" {...register('endDate', { required: true })} min={startDate || projectStartDate || today} max={projectEndDate} />
      <input name="assignedTo" placeholder="Assigned To (Email)" {...register('assignedTo', { required: true })} />
      <button type="submit">Add Task</button>
    </form>
  );
};

export default TaskForm;
