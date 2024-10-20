import axios from 'axios';

export const getData = async () => {
    const response = await axios.get('http://localhost:8080/api/v1/packages');
    return response.data;
};

interface PackageData {
    name: string;
    version: string;
};

//Getters

// Interact with the package with this ID.

export const getPackage = async (id: string, baseURL: string) => {
    const response = await axios.get(`${baseURL}/package/${id}`);
    return response.data;
};

// Get ratings for this package.

export const getPackageRatings = async (id: string, baseURL: string) => {
    const response = await axios.get(`${baseURL}/package/${id}/rate`);
    return response.data;
};

// Get the cost of a package

export const getPackageCost = async (id: string, baseURL: string) => {
    const response = await axios.get(`${baseURL}/package/${id}/cost`);
    return response.data;
};

// Interact with the package with this Name.

export const getPackageName = async (name: string, baseURL: string) => {
    const response = await axios.get(`${baseURL}/package/byName/${name}`);
    return response.data;
};

// Get the list of tracks a student has planned to implement in their code

export const getPlannedTrack = async (baseURL: string) => {
    const response = await axios.get(`${baseURL}/tracks`);
    return response.data;
};

// Setters 

// Update this content of the package

export const updatePackage = async (id: string, data: PackageData, baseURL: string) =>{
    const response = await axios.put(`${baseURL}/package/${id}`, data);
    return response.data;
}

// Authenticate the user

export const authenticateUser = async (data: PackageData, baseURL: string) => {
    const response = await axios.post(`${baseURL}/authenticate`, data);
    return response.data;
};

export const postPackages = async (data: PackageData, baseURL: string) => {
    const response = await axios.post(`${baseURL}/packages`, data);
    return response.data;
};

export const putData = async (data: PackageData, baseURL: string) => {
    const response = await axios.put(`${baseURL}/packages`, data);
    return response.data;
};

// Delete the package with this ID

export const resetTheRegistery = async (baseURL: string) => {
    await axios.delete(`${baseURL}/reset`);
    return "Registry is reset";
};


export const deletePackageVersion = async (data: PackageData, baseURL: string) => {
    await axios.delete(`${baseURL}/packages/${data}`);
    return "Package is deleted";
};

export const deletePackage = async (data: PackageData, baseURL: string) => {
    await axios.delete(`${baseURL}/packages/${data}`);
    return "Package is deleted";
}