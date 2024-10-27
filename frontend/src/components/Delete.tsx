import React, { useState } from "react";

export default function Delete(): JSX.Element {
    const [packageId, setPackageId] = useState("");
    const [responseMessage, setResponseMessage] = useState("");

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPackageId(e.target.value);
        setResponseMessage(""); // Clear response message when user starts typing
    };

    const handleDelete = async () => {
        if (!packageId) {
            setResponseMessage("Please enter a package ID.");
            return;
        }

        try {
            // Replace with the actual API endpoint and delete logic
            const response = await fetch(`/api/packages/${packageId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setResponseMessage("Package deleted successfully.");
            } else {
                setResponseMessage("Failed to delete the package. Please try again.");
            }
        }
        catch (error) {
            console.error("Failed to delete the package:", error);
            setResponseMessage("Failed to delete the package. Please try again.");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleDelete();
        }
    };

    return (
        <div className="min-w-[700px] flex flex-col items-center gap-10">
            <label className="text-3xl text-white" htmlFor="packageId">Delete Package by ID</label>
            <input
                id="packageId"
                type="text"
                value={packageId}
                onChange={handleIdChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter Package ID"
                className="text-3xl rounded caret-black p-2"
            />
            <button onClick={handleDelete} className="mt-4 px-6 py-3 bg-red-500 text-white rounded-lg">
                Delete Package
            </button>
            {responseMessage && <span className="text-red-500 mt-2">{responseMessage}</span>}
        </div>
    );
}
