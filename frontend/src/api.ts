import axios from "axios";
import { env } from "process";

const API_BASE_URL = "http://localhost:4000/dev";
if (!localStorage.getItem("authToken")) {
  localStorage.setItem("authToken", "");
}
const authToken = localStorage.getItem("authToken");
const githubToken = env.GITHUB_TOKEN;

export const registerUser = async (username: string, password: string, isAdministrator: boolean) => {
  try {
    console.log("Registering user...");
    const response = await axios.post(
      `${API_BASE_URL}/register`,
      {
        name: username,
        password: password,
        isAdmin: isAdministrator
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    if (response.status === 201 || response.status === 200) {
      console.log("User registered successfully.");
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the RegistrationRequest or it is formed improperly.");
    } else if (response.status === 409) {
      throw new Error("The user already exists.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const authenticateUser = async (username: string, password: string, isAdministrator: boolean) => {
  try {
    console.log("Authenticating user...");
    const response = await axios.put(
      `${API_BASE_URL}/authenticate`,
      {
        User: {
          name: username,
          isAdmin: isAdministrator
        },
        Secret: {
          password
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    if (response.status === 200 || response.status === 201) {
      console.log("User authenticated successfully.");
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the AuthenticationRequest or it is formed improperly.");
    } else if (response.status === 401) {
      throw new Error("The user or password is invalid.");
    } else if (response.status === 501) {
      throw new Error("This system does not support authentication.");
    } else {
      throw new Error("An unknown error occurred.");
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackages = async (queryParams?: object, offset?: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/packages`, queryParams, {
      params: { offset },
      headers: {
        "X-Authorization": authToken,
        "Content-Type": "application/json"
      }
    });
    if (response.status === 200) {
      console.log("Packages retrieved successfully.");
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.");
    } else if (response.status === 403) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 413) {
      throw new Error("Too many packages returned.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackageById = async (packageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}`);
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the PackageID or it is formed improperly, or is invalid.");
    } else if (response.status === 403) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 404) {
      throw new Error("Package does not exist.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const updatePackageById = async (packageId: string, packageData: object) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/package/${packageId}`, packageData, {
      headers: {
        "X-Authorization": authToken,
        "Content-Type": "application/json"
      }
    });
    if (response.status === 200) {
      console.log("Version is updated.");
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the PackageID or it is formed improperly, or is invalid.");
    } else if (response.status === 403) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 404) {
      throw new Error("Package does not exist.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const resetRegistry = async (authToken: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/reset`, {
      headers: {
        "X-Authorization": authToken
      }
    });
    if (response.status === 200) {
      console.log("Registry is reset.");
      return response.data;
    } else if (response.status === 401) {
      throw new Error("You do not have permission to reset the registry.");
    } else if (response.status === 403) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackageRate = async (packageId: string, authToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}/rate`, {
      headers: {
        "X-Authorization": authToken
      }
    });
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the PackageID");
    } else if (response.status === 403) {
      throw new Error("	Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 404) {
      throw new Error("Package does not exist.");
    } else if (response.status === 500) {
      throw new Error("The package rating system choked on at least one of the metrics.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackageCost = async (packageId: string, dependency: boolean, authToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}/cost`, {
      params: { dependency },
      headers: {
        "X-Authorization": authToken
      }
    });
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the PackageID");
    } else if (response.status === 403) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 404) {
      throw new Error("Package does not exist.");
    } else if (response.status === 500) {
      throw new Error("The package rating system choked on at least one of the metrics.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const searchPackagesByRegEx = async (regex: string, authToken: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/package/byRegEx`,
      { RegEx: regex },
      {
        headers: {
          "X-Authorization": authToken,
          "Content-Type": "application/json"
        }
      }
    );
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid");
    } else if (response.status === 403) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 404) {
      throw new Error("No package found under this regex.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const getTracks = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tracks`);
    if (response.status === 200) {
      console.log("Tracks retrieved successfully.");
      return response.data;
    } else if (response.status === 500) {
      throw new Error("The system encountered an error while retrieving the student's track information.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const uploadPackage = async (content: string, JSProgram: string, debloat: boolean, name: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/package`,
      {
        Content: content,
        JSProgram: JSProgram,
        debloat: debloat,
        Name: name
      },
      {
        headers: {
          "X-Authorization": authToken,
          "Content-Type": "application/json"
        }
      }
    );
    if (response.status === 200) {
      console.log("Success. Check the ID in the returned metadata for the official ID.");
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the PackageUpload or it is formed improperly, or is invalid.");
    } else if (response.status === 403) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 409) {
      throw new Error("Package exists already.");
    } else if (response.status === 424) {
      throw new Error("Package is not uploaded due to the disqualified rating.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackageByURL = async (owner: string, repo: string) => {
  const GitHubAPI = `https://api.github.com/repos/${owner}/${repo}`;
  try {
    const response = await axios.get(GitHubAPI, {
      headers: {
        "Content-Type": "application/json",
        Authorization: githubToken
      }
    });

    if (response.status === 200) {
      console.log("Package retrieved successfully.");
      return response.data;
    } else if (response.status === 400) {
      throw new Error("There is missing field(s) in the URL or it is formed improperly, or is invalid.");
    } else if (response.status === 401) {
      throw new Error("Authentication failed due to invalid or missing AuthenticationToken.");
    } else if (response.status === 403) {
      throw new Error("You do not have permission to access this package.");
    } else if (response.status === 404) {
      throw new Error("Package does not exist.");
    } else {
      throw new Error(`An unknown error occurred. ${response.status}`);
    }
  }
  catch (error) {
    console.log(error);
  }
};