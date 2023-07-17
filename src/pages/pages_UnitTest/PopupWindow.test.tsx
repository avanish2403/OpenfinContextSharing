import { render, screen } from '@testing-library/react';
import PopupWindow from '../PopupWindow';
import '@testing-library/jest-dom';

describe('PopupWindow', () => {
  it('renders the heading correctly', () => {
    render(<PopupWindow />);
    const heading = screen.getByRole('heading', { name: 'Sample Popup' });
    expect(heading).toBeInTheDocument();
  });

  it('renders the description paragraph correctly', () => {
    render(<PopupWindow />);
    const description = screen.getByText('This is a same popup');
    expect(description).toBeInTheDocument();
  });

  it('renders the Allotment component with the correct props', () => {
    render(<PopupWindow />);
    const allotmentComponent = screen.getByTestId('allotment-component');
    expect(allotmentComponent).toHaveAttribute('vertical', 'true');
  });
});
