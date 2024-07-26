import React from 'react';
import { useForm } from 'react-hook-form';
import '../styles/MilestoneForm.css';

const MilestoneForm = ({ onAddMilestone, projectStartDate, projectEndDate }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  const startDate = watch('startDate', ''); // Watch the startDate field

  const onSubmit = (data) => {
    onAddMilestone(data);
    reset();
  };

  const today = new Date().toISOString().split('T')[0]; // Get today's date in yyyy-mm-dd format

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="milestone-form">
      <input name="name" placeholder="Milestone Name" {...register('name', { required: true })} />
      <input name="description" placeholder="Milestone Description" {...register('description')} />
      <input type="date" name="startDate" {...register('startDate', { required: true })} min={projectStartDate || today} max={projectEndDate} />
      <input type="date" name="endDate" {...register('endDate', { required: true })} min={startDate || projectStartDate || today} max={projectEndDate} />
      <button type="submit">Add Milestone</button>
    </form>
  );
};

export default MilestoneForm;
