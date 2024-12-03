import React, { useState } from "react";
import { getPackageRate } from "../api";

export default function Rate(): JSX.Element {
    const [packageId, setPackageId] = useState("");
    const [rate, setRate] = useState<number | null>(null);
    const [responseMessage, setResponseMessage] = useState("");

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPackageId(e.target.value);
        setResponseMessage(""); // Clear response message when user starts typing
        setRate(null); // Clear rate when user starts typing
    };

    const handleGetRate = async () => {
        if (!packageId) {
            setResponseMessage("Please enter a package ID.");
            return;
        }

        try {
            // Replace with the actual API endpoint to get the package rate
            const response = await getPackageRate(packageId);
            if (response) {
                setRate(response.rate);
                setResponseMessage("Package rate retrieved successfully.");
            } else {
                setResponseMessage("Failed to get the package rate. Please try again.");
            }
        } catch {
            setResponseMessage("An error occurred. Please try again later.");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGetRate();
        }
    };

    return (
        <div className="min-w-[700px] flex flex-col items-center gap-10">
            <label className="text-3xl text-white" htmlFor="packageId">Get Package Rate by ID</label>
            <input
                id="packageId"
                type="text"
                value={packageId}
                onChange={handleIdChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter Package ID"
                className="text-3xl rounded caret-black p-2"
            />
            <button onClick={handleGetRate} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg">
                Get Package Rate
            </button>
            {responseMessage && <span className="text-red-500 mt-2">{responseMessage}</span>}
            {rate !== null && (
                <div className="mt-4 text-3xl text-white">
                    Package Rate: {rate}
                </div>
            )}
        </div>
    );
}
