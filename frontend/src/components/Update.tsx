import React, { useState } from 'react';
import { updatePackageById } from '../api';

export default function Update(): JSX.Element {
  const [packageId, setPackageId] = useState('');
  const [updateData, setUpdateData] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPackageId(e.target.value);
    setResponseMessage(''); // Clear response message when user starts typing
  };

  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUpdateData(e.target.value);
    setResponseMessage(''); // Clear response message when user starts typing
  };

  const handleUpdate = async () => {
    if (!packageId || !updateData) {
      setResponseMessage('Please enter both package ID and data to update.');
      return;
    }

    try {
      console.log(packageId, "\n");
      const response = await updatePackageById(packageId, JSON.parse(updateData));

      if (response.status === 200) {
        setResponseMessage('Package updated successfully.');
      } else {
        setResponseMessage('Failed to update the package. Please try again.');
      }
    } catch (error) {
        console.error(error);
      setResponseMessage('An error occurred. Please try again later.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdate();
    }
  };

  return (
    <div className="min-w-[700px] flex flex-col items-center gap-10">
      <label className="text-3xl text-white" htmlFor="packageId">Update Package by ID</label>
      <input
        id="packageId"
        type="text"
        value={packageId}
        onChange={handleIdChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter Package ID"
        className="text-3xl rounded caret-black p-2"
      />
      <textarea
        value={updateData}
        onChange={handleDataChange}
        placeholder="Enter update data"
        className="text-3xl rounded caret-black p-2 mt-4"
        rows={5}
      />
      <button onClick={handleUpdate} className="mt-4 px-6 py-3 bg-yellow-500 text-white rounded-lg">
        Update Package
      </button>
      {responseMessage && <span className="text-red-500 mt-2">{responseMessage}</span>}
    </div>
  );
}
