require('dotenv').config();
const axios = require("axios");

const token = process.env.TEST_TOKEN;

const readCompaniesEndpoint = 'https://api.hubapi.com/crm/v3/objects/companies';
const mergeEndpoint = 'https://api.hubapi.com/crm/v3/objects/companies/merge';


async function readCompanies(){
    try {
        const allCompanies = [];
        let after = null; // Initialize the cursor for pagination
        let hasMore = true; // Flag to determine if more pages exist
        let pageCount = 0; // Counter to track the number of pages fetched

        while (hasMore && pageCount < 2) { // Stop after fetching 2 pages
            const response = await axios.get(readCompaniesEndpoint, {
                headers:{
                    'Authorization':`Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params:{
                  limit:10,
                  after: after || undefined,
                  properties: "name,account_id_sugar"
                }
            });

            const data = response.data;
            const dataResults = data.results;

            
            dataResults.forEach(item => {
                allCompanies.push({id:item.id, name:item.properties.name, accountIdSugar: item.properties.account_id_sugar, date: item.createdAt})
            });

            console.log(dataResults)


            pageCount++;
            // Update the cursor and check if there are more pages
            if (data.paging && data.paging.next && data.paging.next.after) {
                after = data.paging.next.after;
            } else {
                hasMore = false; // Stop if there are no more pages
            }
        }

          // Count occurrences of each name
          const nameCounts = allCompanies.reduce((acc, company) => {
            acc[company.name] = (acc[company.name] || 0) + 1;
            return acc;
        }, {});

        // Add the repeated count to each company
        const companiesWithRepetition = allCompanies.map(company => ({
            ...company,
            repeated: nameCounts[company.name] // Add the count of repetitions
        }));

        
        let companiesWithoutDuplicates = companiesWithRepetition.filter((item) => item.repeated == 1);
        let companiesWithDuplicates = []
        let totalDuplicates = companiesWithRepetition.filter((item) => item.repeated > 1);
        totalDuplicates.forEach(item =>{
            if(!companiesWithDuplicates.includes(item.name)){
                companiesWithDuplicates.push(item.name)
            }
        })
        console.log("All Companies:", allCompanies.length);
        console.log("Companies without duplicates:", companiesWithoutDuplicates.length);
        console.log("Companies with duplicates:", companiesWithDuplicates.length);
        console.log("Detail of companies with duplicates:", totalDuplicates);
        console.log("Total of duplicates that will be merged:", totalDuplicates.length)

        // Organize the data for merging duplicates

        const organizeData = (array) => {
            const grouped = {};
          
            array.forEach(record => {
              const { name, id, accountIdSugar, date } = record;
          
              if (!grouped[name]) {
                grouped[name] = { primaryRecord: null, primaryRecordDate: null, duplicates: [], hasAccountIdSugar: false };
              }
          
              const group = grouped[name];
          
              if (accountIdSugar) {
                group.hasAccountIdSugar = true;
              }
          
              // Decide primaryRecord logic
              if (
                (!group.hasAccountIdSugar && !group.primaryRecord) || // No accountIdSugar yet and no primary record
                (group.hasAccountIdSugar && accountIdSugar && (!group.primaryRecord || new Date(date) < new Date(group.primaryRecordDate))) || // Both have accountIdSugar, choose oldest
                (!group.hasAccountIdSugar && new Date(date) < new Date(group.primaryRecordDate)) // No accountIdSugar, choose oldest
              ) {
                if (group.primaryRecord) {
                  group.duplicates.push(group.primaryRecord); // Move the previous primary to duplicates
                }
                group.primaryRecord = id;
                group.primaryRecordDate = date;
              } else {
                // If it's not the primaryRecord, add to duplicates
                group.duplicates.push(id);
              }
            });
          
            // Remove temporary fields and return the result
            const result = Object.keys(grouped).map(name => {
              const { primaryRecord, duplicates, hasAccountIdSugar } = grouped[name];
              return {
                'companyRecord': name,
                primaryRecord,
                duplicates,
                hasAccountIdSugar
              }
            });

            console.log(result)
          };
          organizeData(totalDuplicates)

          

    } catch(error){
        console.log(error)
    }
}

readCompanies()


