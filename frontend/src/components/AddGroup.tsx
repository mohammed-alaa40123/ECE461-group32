import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { addGroup } from "../api"; // Adjust path as needed
import Loading from "./ui/loading";

const AddGroup: React.FC = () => {
  const [group, setGroup] = useState<string>("");
//   const [groups, setGroups] = useState<string[]>([]);
  const [isAdministrator, setIsAdministrator] = useState(false);
//   const [assignToGroup, setAssignToGroup] = useState(false);
//   const [grantPermissions, setGrantPermissions] = useState(false);
  
  const [permissions, setPermissions] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<[string, boolean]>(["", false]);
  const [loading, setLoading] = useState(false);

//   const handleGroups = async () => {
//     const groups = await getGroups();
//     setGroups(groups);
//   };

  const handlePermissions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (checked) {
      setPermissions([...permissions, name]);
    } else {
      setPermissions(permissions.filter((permission) => permission !== name));
    }
  };


  const handleAddGroup = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);
    const response = await addGroup(group, permissions); // Will throw on error
    if (response)
        setFeedbackMessage(["Group added successfully", true]);
  } catch (err: unknown) {
    if (err instanceof Error) {
      setFeedbackMessage([err.message, false]); // Display the error message
    } else {
      setFeedbackMessage(["An unexpected error occurred", false]); // Fallback for unknown errors
    }
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <Loading />; // Show the spinner while loading is true
  }

  return (
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center text-3xl">
      <h2 className="text-3xl font-bold text-white mb-6">Add a Group</h2>
      <form data-testid="add-group-form" onSubmit={handleAddGroup} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="username">
            Group Name
          </label>
          <input
            id="username"
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              <input
                className="scale-[2] mr-4"
                type="checkbox"
                checked={isAdministrator}
                onChange={(e) => setIsAdministrator(e.target.checked)}
              />
              Admin User
            </label>
            {!isAdministrator && (
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  <input className="scale-[2] mr-4" type="checkbox" onChange={handlePermissions} />
                  Upload
                </label>
                <label className="block text-gray-700 font-bold mb-2">
                  <input className="scale-[2] mr-4" type="checkbox" onChange={handlePermissions} />
                  Download
                </label>
                <label className="block text-gray-700 font-bold mb-2">
                  <input className="scale-[2] mr-4" type="checkbox" onChange={handlePermissions} />
                  Search
                </label>
              </div>
            )}
          </div>
        <p className={`${feedbackMessage[1]? "text-green-500" : "text-red-500"}  italic mb-4`}>{feedbackMessage[0]}</p>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Add Group
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGroup;
