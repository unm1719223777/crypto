import { useState, createContext } from "react";
import API from "../API";

const currencyListContext = createContext({});

export const CurrencyListProvider = (props) => {
	const [currencyList, setCurrencyList] = useState([]);
	const [exchanges, setExchanges] = useState([]);

	// Function to fetch currency list
	const getCurrencyList = () => {
		API.get("/assets")
			.then((res) => {
				setCurrencyList(res.data.data);
			})
			.catch((error) => {
				setCurrencyList([]);
				console.error("Error fetching currency list:", error);
			});
	};

	// Function to fetch exchanges with retry logic
	const getExchangesWithRetry = async (retries = 3, delay = 5000) => {
		try {
			const res = await API.get("/exchanges");
			setExchanges(res.data.data);
		} catch (error) {
			if (error.response && error.response.status === 429 && retries > 0) {
				console.warn(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
				await new Promise(resolve => setTimeout(resolve, delay));
				return getExchangesWithRetry(retries - 1, delay * 2); // Exponential backoff
			}
			setExchanges([]);
			console.error("Failed to fetch exchanges:", error);
		}
	};

	// Wrapper function to call the retry function
	const getExchanges = () => {
		getExchangesWithRetry();
	};

	const values = {
		currencyList: currencyList,
		exchanges: exchanges,
		getCurrencyList: getCurrencyList,
		getExchanges: getExchanges,
	};

	return (
		<currencyListContext.Provider value={values}>
			{props.children}
		</currencyListContext.Provider>
	);
};

export default currencyListContext;
