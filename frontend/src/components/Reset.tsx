import { useState } from "react";
import { resetRegistry } from "../api";

export default function Reset(): JSX.Element {
    const token: string = localStorage.getItem("authToken") ?? "";
    const [responseMessage, setResponseMessage] = useState("");

    const handleReset = async () => {
        try {
            const response = await resetRegistry(token);
            if (response.ok) {
                setResponseMessage("Registery reset successfully.");
            } else {
                setResponseMessage("Failed to reset the registery. Please try again.");
            }
        }
        catch (error) {
            console.error("Failed to reset the registery:", error);
            setResponseMessage("Failed to reset the registery. Please try again.");
        }
    };

    return (
        <div className="min-w-[700px] flex flex-col items-center gap-10">
            <button onClick={handleReset} className="mt-4 px-6 py-3 bg-red-500 text-white rounded-lg">
                Reset the registry
            </button>
            {responseMessage && <span className="text-red-500 mt-2">{responseMessage}</span>}
        </div>
    );
}
