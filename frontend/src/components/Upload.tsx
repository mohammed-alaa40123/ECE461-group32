import React from "react";
import { FileUploadModal } from "./FileUploadModal";

export default function Upload(): JSX.Element {
    const URLRegEx= /(https:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/i;
    const [url, setUrl] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        setErrorMessage(""); // Clear error message when user starts typing
    };

    const handleUrlSubmit = () => {
        if (URLRegEx.test(url)) {
            console.log("Valid URL: ", url);
        } else {
            setErrorMessage("Invalid URL");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleUrlSubmit();
        }
    };

    return (
        <div className="min-w-[700px] flex gap-10 items-center">
            <FileUploadModal />
            <div className="bg-white h-96 w-[1px]"></div>
            <div className="flex flex-col items-center gap-10">
                <label className="text-3xl text-white" htmlFor="url">Upload by URL</label>
                <input
                    id="url"
                    type="text"
                    value={url}
                    onChange={handleUrlChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter a valid URL"
                    className="text-3xl rounded caret-black p-2"
                />
                <button onClick={handleUrlSubmit} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg">
                    Upload
                </button>
                {errorMessage && <span className="text-red-500 mt-2">{errorMessage}</span>}
            </div>
        </div>
    );
}
