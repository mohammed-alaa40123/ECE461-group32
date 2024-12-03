// import React, { useState } from "react";
// import { registerUser, getGroupsAndPermissions } from "../api";
// import Loading from "./ui/loading";

// const AddUser: React.FC = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [groups, setGroups] = useState<string[]>([]);
//   const [isAdministrator, setIsAdministrator] = useState(false);
//   const [assignToGroup, setAssignToGroup] = useState(false);
//   const [grantPermissions, setGrantPermissions] = useState(false);
  
//   const [permissions, setPermissions] = useState<string[]>([]);
//   const [feedbackMessage, setFeedbackMessage] = useState<[string, boolean | null]>(["", null]);
//   const [loading, setLoading] = useState(false);

//   const handleGroups = async () => {
//     const groups = await getGroupsAndPermissions();
//     setGroups(groups);
//   };  

//   const handlePermissions = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, checked } = e.target;
//     if (checked) {
//       setPermissions([...permissions, name]);
//     } else {
//       setPermissions(permissions.filter((permission) => permission !== name));
//     }
//   };


//   const handleAddUser = async (e: React.FormEvent) => {
//     e.preventDefault();
//     // setFeedbackMessage("");

//     if (password !== confirmPassword) {
//       setFeedbackMessage(["Passwords do not match", false]);
//       return;
//     }

//     try {
//       setLoading(true);
//       const data = await registerUser(username, password, isAdministrator, permissions, groups);
//       if (data) {
//         setFeedbackMessage(["User added successfully", true]);
//       } else {
//         setFeedbackMessage(["Failed to add user. Please try again.", false]);
//       }
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         setFeedbackMessage([err.message, false]); // Safely access the error message if it’s an instance of Error
//       } else {
//         setFeedbackMessage(["An unexpected error occurred", false]); // Fallback message if err is not of type Error
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <Loading />; // Show the spinner while loading is true
//   }

//   return (
//     <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center text-3xl">
//       <h2 className="text-3xl font-bold text-white mb-6">Sign Up</h2>
//       <form onSubmit={handleAddUser} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
//         <div className="mb-4">
//           <label className="block text-gray-700 font-bold mb-2" htmlFor="username">
//             Username
//           </label>
//           <input
//             id="username"
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700 font-bold mb-2" htmlFor="password">
//             Password
//           </label>
//           <input
//             id="password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block text-gray-700 font-bold mb-2" htmlFor="confirmPassword">
//             Confirm Password
//           </label>
//           <input
//             id="confirmPassword"
//             type="password"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             required
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//           />
//         </div>
//         <div className="m-6 flex whitespace-nowrap gap-10">
//           <button
//             className={`p-3 rounded ${grantPermissions ? "bg-green-700 text-white " : "bg-gray-900 bg-opacity-50 text-black"}`}
//             onClick={(e: React.FormEvent) => {
//               e.preventDefault();
//               setGrantPermissions(true);
//               setAssignToGroup(false);
//             }}
//           >
//             Grant Permission
//           </button>
//           <button
//             className={`p-3 rounded ${assignToGroup ? "bg-green-700 text-white " : "bg-gray-900 bg-opacity-50 text-black"}`}
//             onClick={(e: React.FormEvent) => {
//               e.preventDefault();
//               setAssignToGroup(true);
//               setGrantPermissions(false);
//             }}>
//             Assign to Group
//           </button>
//         </div>
//         {assignToGroup && (
//           <div className="mb-4">
//             <label className="block text-gray-700 font-bold mb-2" htmlFor="groups">
//               Group
//             </label>
//             <select
//               id="groups"
//               onChange={handleGroups}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
//               <option value="">Select a group</option>
//               {groups.map((group) => (
//                 <option key={group} value={group}>
//                   {group}
//                 </option>
//               ))}
//             </select>
//           </div>
//         )}
//         {grantPermissions && (
//           <div className="mb-4">
//             <label className="block text-gray-700 font-bold mb-2">
//               <input
//                 className="scale-[2] mr-4"
//                 type="checkbox"
//                 checked={isAdministrator}
//                 onChange={(e) => setIsAdministrator(e.target.checked)}
//               />
//               Admin User
//             </label>
//             {!isAdministrator && (
//               <div>
//                 <label className="block text-gray-700 font-bold mb-2">
//                   <input className="scale-[2] mr-4" type="checkbox" onChange={handlePermissions} />
//                   Upload
//                 </label>
//                 <label className="block text-gray-700 font-bold mb-2">
//                   <input className="scale-[2] mr-4" type="checkbox" onChange={handlePermissions} />
//                   Download
//                 </label>
//                 <label className="block text-gray-700 font-bold mb-2">
//                   <input className="scale-[2] mr-4" type="checkbox" onChange={handlePermissions} />
//                   Search
//                 </label>
//               </div>
//             )}
//           </div>
//         )}
//         {feedbackMessage[1] === false && <p className="text-red-500 italic mb-4">{feedbackMessage[0]}</p>}
//         <div className="flex items-center justify-between">
//           <button
//             type="submit"
//             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
//             Add User
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AddUser;

import React, { useState, useEffect } from "react";
import { registerUser, getGroupsAndPermissions } from "../api";
import Loading from "./ui/loading";

const AddUser: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [assignToGroup, setAssignToGroup] = useState(false);
  const [grantPermissions, setGrantPermissions] = useState(false);

  const [permissions, setPermissions] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignToGroup) {
      handleGroups();
    }
  }, [assignToGroup]);

  const handleGroups = async () => {
    const groups = await getGroupsAndPermissions();
    setGroups(groups);
  };

  const handlePermissions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (checked) {
      setPermissions([...permissions, name]);
    } else {
      setPermissions(permissions.filter((permission) => permission !== name));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    
    if (password !== confirmPassword) {
      setFeedbackMessage({ message: "Passwords do not match", type: "error" });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser(username, password, isAdministrator, permissions, groups);
      if (data) {
        setFeedbackMessage({ message: "User added successfully", type: "success" });
      } else {
        setFeedbackMessage({ message: "Failed to add user. Please try again.", type: "error" });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedbackMessage({ message: err.message, type: "error" });
      } else {
        setFeedbackMessage({ message: "An unexpected error occurred", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center text-3xl">
      <h2 className="text-3xl font-bold text-white mb-6">Sign Up</h2>
      <form onSubmit={handleAddUser} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="m-6 flex whitespace-nowrap gap-10">
          <button
            type="button"
            className={`p-3 rounded ${grantPermissions ? "bg-green-700 text-white " : "bg-gray-900 bg-opacity-50 text-black"}`}
            onClick={() => {
              setGrantPermissions(true);
              setAssignToGroup(false);
            }}
          >
            Grant Permission
          </button>
          <button
            type="button"
            className={`p-3 rounded ${assignToGroup ? "bg-green-700 text-white " : "bg-gray-900 bg-opacity-50 text-black"}`}
            onClick={() => {
              setAssignToGroup(true);
              setGrantPermissions(false);
            }}
          >
            Assign to Group
          </button>
        </div>
        {assignToGroup && (
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="groups">
              Group
            </label>
            <select
              id="groups"
              onChange={handleGroups}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        )}
        {grantPermissions && (
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
                  <input className="scale-[2] mr-4" name="Upload" type="checkbox" onChange={handlePermissions} />
                  Upload
                </label>
                <label className="block text-gray-700 font-bold mb-2">
                  <input className="scale-[2] mr-4" name="Download" type="checkbox" onChange={handlePermissions} />
                  Download
                </label>
                <label className="block text-gray-700 font-bold mb-2">
                  <input className="scale-[2] mr-4" name="Search" type="checkbox" onChange={handlePermissions} />
                  Search
                </label>
              </div>
            )}
          </div>
        )}
          {feedbackMessage.type === "error" && <p className="text-red-500 italic mb-4">{feedbackMessage.message}</p>}
          {feedbackMessage.type === "success" && <p className="text-green-500 italic mb-4">{feedbackMessage.message}</p>}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add User
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
