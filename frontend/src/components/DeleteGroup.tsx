import React, {useState, useEffect} from "react";
import {getGroupsAndPermissions, deleteGroup} from "../api";


export default function DeleteGroup() {
    const [groups, setGroups] = useState<{id: number, name: string}[]>([]);

    useEffect (() => {
        getGroupsAndPermissions()
        .then((res) => res)
        .then((res) => setGroups(res.groups));
    }, []);
    console.log(groups);

    async function handleDeleteGroup(id: number) {
        await deleteGroup(id);
        setGroups(groups.filter((group) => group.id !== id));
    }

    return (
        <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center text-3xl">
      <h2 className="text-3xl font-bold text-white mb-6">Delete A Group</h2>
        <div className="bg-white rounded max-h-fit ">
            {groups.length > 0 ? groups.map((group, i) => (
                    <div key={group.id} className="flex items-center justify-between bg-white shadow-md rounded px-8 pt-6 pb-8 gap-8">
                        <div>
                            <p>{group.name}</p>
                        </div>
                        <div>
                            <button name={`button-${i+1}`} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" type="button" onClick={() => handleDeleteGroup(group.id)}>Delete</button>
                        </div>
                    </div>
                )) : <p className="p-7">No groups found</p>
            }
        </div> 
    </div>
    )
};