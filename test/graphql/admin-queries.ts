import gql from "graphql-tag";

export const GET_CUSTOMER_LIST = gql`
  query GetCustomerList($options: CustomerListOptions) {
    customers(options: $options) {
      items {
        id
        title
        firstName
        lastName
        emailAddress
        phoneNumber
        user {
          id
          identifier
        }
      }
      totalItems
    }
  }
`;
