import React, { useState } from "react";
import { getPackages } from "../api";


export default function GetPackages(): JSX.Element {
    // const [packageId, setPackageId] = useState("");
    const [query, setQuery] = useState<string>("*");
    const [numOfPages, setnumOfPages] = useState<number>(1);
    const [responseMessage, setResponseMessage] = useState<string | null>(null);

    // const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setPackageId(e.target.value);
    //     setResponseMessage(""); // Clear response message when user starts typing
    //     setDownloadLink(""); // Clear download link when user starts typing
    // };

    
    
    const handleQuery = async () => {

        try {
                const data = await getPackages(JSON.parse(query), numOfPages);
                if (data) {
                    setResponseMessage(data);
                    
                } else {
                    setResponseMessage("No packages found");
            }
        } catch (error) {
            setResponseMessage("An error occurred while fetching packages");
            console.error(error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            handleQuery();
        }
    };

    return (
        <div className="min-w-[700px] flex flex-col items-center gap-10">
            <label className="text-3xl text-white" htmlFor="packageQuery">Get Packages by query</label>
            <textarea
                id="packageQuery"
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter Package Query"
                className="text-3xl rounded caret-black p-2"
                rows={6}
            />
            <label className="text-3xl text-white" htmlFor="numOfPages">Number of Pages</label>
            <input
                type="number"
                onChange={(e) => setnumOfPages(e.target.valueAsNumber)}
                placeholder="Enter number of pages"
                className="text-3xl rounded caret-black p-2"
            />
            <button onClick={handleQuery} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg">
                Query Package
            </button>
            {responseMessage && <span className="text-red-500 mt-2">{responseMessage}</span>}
            
        </div>
    );
}
