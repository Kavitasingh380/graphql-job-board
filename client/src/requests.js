import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from 'apollo-boost'
import { isLoggedIn, getAccessToken } from "./auth"
import gql from 'graphql-tag'
import { formatError } from 'graphql';
const endpointURL = "http://localhost:9000/graphql";
const authLink = new ApolloLink((operation, forward) => {
    if (isLoggedIn()) {
        operation.setContext({
            headers: {
                'authorization': 'Bearer ' + getAccessToken()
            }
        })
    }
    return forward(operation)
})
const client = new ApolloClient({
    link: ApolloLink.from([
        authLink,
        new HttpLink({ uri: endpointURL })
    ]),
    cache: new InMemoryCache()
})
const jobDetailFragment = gql`
fragment JobDetail on Job{
       id
       title
       company{
           id
           name
       }
       description
}
`;

// async function graphqlRequest(query, variables = {}) {
//     const request = {
//         method: 'POST',
//         headers: { 'content-type': 'application/json' },
//         body: JSON.stringify({ query, variables })
//     }
//     if (isLoggedIn()) {
//         request.headers['authorization'] = 'Bearer ' + getAccessToken()
//     }
//     const response = await fetch(endpointURL, request)
//     const responseBody = await response.json();
//     if (responseBody.errors) {
//         const message = responseBody.errors.map((error) => error.message).join('\n')
//         throw new Error(message)
//     }
//     return responseBody.data
// }
const jobQuery = gql`
query Jobquery($id:ID!){
   job(id:$id){
    ...JobDetail
   }
}
${jobDetailFragment}
`;
const createJobMutation = gql`mutation CreateJob($input : CreateJobInput){
        job: createJob(input:$input){
                     ...JobDetail
          }
          }
          ${jobDetailFragment}
          `;
const CompanyQuery = gql`
             query CompanyQuery($id :ID!){
                 company(id:$id){
                     id
                     name
                     description
                     jobs{
                         id
                         title
                     }
                 }
             }`

const loadJobsQuery = gql`{
    jobs{
         id
         title
         company{
                 id
                 name
                 description
                 }
               description

     }
}`;

export async function createJob(input) {
    const { data: { job } } = await client.mutate({
        mutation: createJobMutation, variables: { input },
        update: (cache, { data }) => {
            cache.writeQuery({ query: jobQuery, variables: { id: data.job.id }, data, fetchPolicy: "no-cache" })
        }
    });
    return job
}

export async function loadCompany(id) {
    const { data: { company } } = await client.query({ query: CompanyQuery, variables: { id }, fetchPolicy: "no-cache" });
    return company
}
export async function loadJob(id) {
    const { data: { job } } = await client.query({ query: jobQuery, variables: { id }, fetchPolicy: "no-cache" });
    return job
}

export async function loadJobs() {
    const { data: { jobs } } = await client.query({ query: loadJobsQuery, fetchPolicy: "no-cache" })
    return jobs
}