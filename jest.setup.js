import '@testing-library/jest-dom'

global.fetch = jest.fn()

// Mock react-dnd
jest.mock('react-dnd', () => ({
  useDrag: () => [{}, () => {}],
  useDrop: () => [{}, () => {}],
  DndProvider: ({ children }) => children,
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: () => {},
}));