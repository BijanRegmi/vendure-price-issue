import gql from "graphql-tag";

const ORDER_FRAGMENT = gql`
  fragment OrderFields on Order {
    id
    totalWithTax
    subTotal
    subTotalWithTax
    lines {
      id
      unitPrice
      unitPriceWithTax
      linePrice
      linePriceWithTax
      customFields {
        discount
      }
    }
  }
`;

export const ADD_PRODUCT_TO_ORDER = gql`
  mutation AddProductToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      __typename
      ... on Order {
        ...OrderFields
      }
    }
  }
  ${ORDER_FRAGMENT}
`;

export const GET_ACTIVE_ORDER = gql`
  query GetActiveOrder {
    activeOrder {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;

export const SET_DISCOUNT = gql`
  mutation SetDiscount($orderLineId: ID!, $discount: Int!) {
    setDiscount(orderLineId: $orderLineId, discount: $discount) {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;
