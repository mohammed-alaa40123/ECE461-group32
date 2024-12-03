import React, { useState } from "react";
import { getPackageCost } from "../api";

export default function Cost(): JSX.Element {
    const [packageId, setPackageId] = useState("");
    const [cost, setCost] = useState<number | null>(null);
    const [responseMessage, setResponseMessage] = useState("");

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPackageId(e.target.value);
        setResponseMessage(""); // Clear response message when user starts typing
        setCost(null); // Clear cost when user starts typing
    };

    const handleGetCost = async () => {
        if (!packageId) {
            setResponseMessage("Please enter a package ID.");
            return;
        }

        try {
            // Replace with the actual API endpoint to get the package cost
            const response = await getPackageCost(packageId);
            if (response) {
                setCost(response.cost);
                setResponseMessage("Package cost retrieved successfully.");
            } else {
                setResponseMessage("Failed to get the package cost. Please try again.");
            }
        } catch {
            setResponseMessage("An error occurred. Please try again later.");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGetCost();
        }
    };

    return (
        <div className="min-w-[700px] flex flex-col items-center gap-10">
            <label className="text-3xl text-white" htmlFor="packageId">Get Package Cost by ID</label>
            <input
                id="packageId"
                type="text"
                value={packageId}
                onChange={handleIdChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter Package ID"
                className="text-3xl rounded caret-black p-2"
            />
            <button onClick={handleGetCost} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg">
                Get Package Cost
            </button>
            {responseMessage && <span className="text-red-500 mt-2">{responseMessage}</span>}
            {cost !== null && (
                <div className="mt-4 text-3xl text-white">
                    Package Cost: ${cost}
                </div>
            )}
        </div>
    );
}
