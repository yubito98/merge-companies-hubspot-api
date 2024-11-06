require('dotenv').config();
const axios = require("axios");

const token = process.env.TOKEN;

const readCompaniesEndpoint = 'https://api.hubapi.com/crm/v3/objects/companies';
const mergeEndpoint = 'https://api.hubapi.com/crm/v3/objects/companies/merge';

const headers = {
    headers:{
        'Authorization':`Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}

async function getCompanies(){
    try{
        const response = await axios.get(readCompaniesEndpoint, headers);
        const data = response.data;
        console.log(data);
        const company1 = data.results[0].id;
        const company2 = data.results[1].id;
        async function mergeCompanies(){
            try{
                const PublicMergeInput = { objectIdToMerge: company1, primaryObjectId: company2 };
                const mergeResponse = await axios.post(mergeEndpoint, PublicMergeInput, headers)
                const mergeData = mergeResponse.data;
                console.log(mergeData);
            }catch(error){
                console.log(error)
            } 
        }
        await mergeCompanies();
    }catch(error){
        console.log( error)
    }
}


getCompanies();



