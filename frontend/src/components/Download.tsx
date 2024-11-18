import React, { useState } from "react";

export default function Download(): JSX.Element {
    const [packageId, setPackageId] = useState("");
    const [responseMessage, setResponseMessage] = useState("");
    const [downloadLink, setDownloadLink] = useState("");

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPackageId(e.target.value);
        setResponseMessage(""); // Clear response message when user starts typing
        setDownloadLink(""); // Clear download link when user starts typing
    };

    const handleDownload = async () => {
        if (!packageId) {
            setResponseMessage("Please enter a package ID.");
            return;
        }

        try {
            // Replace with the actual API endpoint to get the download URL
            const response = await fetch(`/api/packages/${packageId}/download`, {
                method: "GET",
            });

            if (response.ok) {
                const data = await response.json();
                setDownloadLink(data.downloadUrl);
                setResponseMessage("Package ready for download.");
            } else {
                setResponseMessage("Failed to get the package. Please try again.");
            }
        } catch {
            setResponseMessage("An error occurred. Please try again later.");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleDownload();
        }
    };

    return (
        <div className="min-w-[700px] flex flex-col items-center gap-10">
            <label className="text-3xl text-white" htmlFor="packageId">Download Package by ID</label>
            <input
                id="packageId"
                type="text"
                value={packageId}
                onChange={handleIdChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter Package ID"
                className="text-3xl rounded caret-black p-2"
            />
            <button onClick={handleDownload} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg">
                Download Package
            </button>
            {responseMessage && <span className="text-red-500 mt-2">{responseMessage}</span>}
            {downloadLink && (
                <a
                    href={downloadLink}
                    download
                    className="mt-4 px-6 py-3 bg-green-500 text-white rounded-lg"
                >
                    Click here to download
                </a>
            )}
        </div>
    );
}
