import { render, screen } from '@testing-library/react';
import Profile from '../components/Profile';

test('renders profile component', () => {
  render(<Profile />);
  expect(screen.getByText('Profile')).toBeInTheDocument();
});