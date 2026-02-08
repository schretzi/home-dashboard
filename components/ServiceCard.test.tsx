import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceCard from './ServiceCard';
import { NetworkService } from '../types';

const mockService: NetworkService = {
  id: '1',
  name: 'Test Service',
  description: 'A test service description',
  hostname: 'test.local',
  port: 8080,
  icon: 'dns',
  type: 'internal',
  url: 'http://test.local'
};

describe('ServiceCard Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('renders service details correctly', () => {
    render(<ServiceCard service={mockService} />);
    
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('A test service description')).toBeInTheDocument();
    expect(screen.getByText('test.local')).toBeInTheDocument();
    expect(screen.getByText('PORT 8080')).toBeInTheDocument();
  });

  test('displays "External" status immediately for external services', () => {
    const externalService: NetworkService = { ...mockService, type: 'external' };
    render(<ServiceCard service={externalService} />);
    
    expect(screen.getByText('External')).toBeInTheDocument();
    // Should not show Checking
    expect(screen.queryByText('Checking')).not.toBeInTheDocument();
  });

  test('starts in "Checking" state for internal services', () => {
    render(<ServiceCard service={mockService} />);
    expect(screen.getByText('Checking')).toBeInTheDocument();
  });

  test('updates status to "Online" when check succeeds', async () => {
    // Mock Math.random to ensure success (> 0.1)
    // We use 0.5: 
    // 1. Delay calculation: 800 + 0.5 * 1000 = 1300ms
    // 2. Success check: 0.5 > 0.1 = true
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<ServiceCard service={mockService} />);
    
    expect(screen.getByText('Checking')).toBeInTheDocument();

    // Fast-forward time past the simulated delay
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.queryByText('Checking')).not.toBeInTheDocument();
  });

  test('updates status to "Offline" when check fails', async () => {
    // Mock Math.random to ensure failure (<= 0.1)
    // We use 0.05:
    // 1. Delay calculation: 800 + 0.05 * 1000 = 850ms
    // 2. Success check: 0.05 > 0.1 = false
    jest.spyOn(Math, 'random').mockReturnValue(0.05);

    render(<ServiceCard service={mockService} />);
    
    expect(screen.getByText('Checking')).toBeInTheDocument();

    // Fast-forward time
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});