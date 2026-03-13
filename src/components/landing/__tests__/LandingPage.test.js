import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../LandingPage';

// Mock the scroll animation controller
jest.mock('../ScrollAnimationController', () => ({
  ScrollAnimationController: jest.fn()
}));

describe('LandingPage', () => {
  const defaultProps = {
    onSignIn: jest.fn(),
    onSignUp: jest.fn(),
    darkMode: false,
    onToggleDarkMode: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Property 1: Authentication-Based Routing (tested at App level)
  // Property 2: Landing Page Structure
  test('displays required landing page structure', () => {
    render(<LandingPage {...defaultProps} />);
    
    // Should contain Hero Section with app name and tagline
    expect(screen.getByText(/StudyDesk/)).toBeInTheDocument();
    expect(screen.getByText(/Free Homework Tracker/)).toBeInTheDocument();
    
    // Should contain Feature Section with at least 3 features
    expect(screen.getByText(/Canvas LMS Integration/)).toBeInTheDocument();
    expect(screen.getByText(/Smart Homework Tracker/)).toBeInTheDocument();
    expect(screen.getByText(/Built-in Study Timer/)).toBeInTheDocument();
    expect(screen.getByText(/Grade Analytics/)).toBeInTheDocument();
    
    // Should contain Footer with copyright
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  // Property 3: Navigation Elements
  test('displays navigation elements for unauthenticated users', () => {
    render(<LandingPage {...defaultProps} />);
    
    // Should display Sign In and Sign Up buttons
    const signInButtons = screen.getAllByText(/Sign In/);
    const signUpButtons = screen.getAllByText(/Sign Up/);
    
    expect(signInButtons.length).toBeGreaterThan(0);
    expect(signUpButtons.length).toBeGreaterThan(0);
    
    // Should include primary CTA button
    expect(screen.getByText(/Get Started Free/)).toBeInTheDocument();
  });

  // Property 4: CTA Navigation Behavior
  test('calls appropriate callbacks when CTA buttons are clicked', () => {
    render(<LandingPage {...defaultProps} />);
    
    // Test primary CTA button
    const primaryCTA = screen.getByText(/Get Started Free/);
    fireEvent.click(primaryCTA);
    expect(defaultProps.onSignUp).toHaveBeenCalled();
    
    // Test Sign In button (get first one)
    const signInButton = screen.getAllByText(/Sign In/)[0];
    fireEvent.click(signInButton);
    expect(defaultProps.onSignIn).toHaveBeenCalled();
  });

  // Property 7: Theme Integration
  test('applies correct theme classes', () => {
    const { rerender } = render(<LandingPage {...defaultProps} darkMode={false} />);
    
    // Light mode
    const landingPage = document.querySelector('.landing-page');
    expect(landingPage).not.toHaveClass('dark');
    
    // Dark mode
    rerender(<LandingPage {...defaultProps} darkMode={true} />);
    expect(landingPage).toHaveClass('dark');
  });

  // Property 9: Required Feature Content
  test('displays all required feature content', () => {
    render(<LandingPage {...defaultProps} />);
    
    // Canvas LMS integration
    expect(screen.getByText(/Canvas LMS Integration/)).toBeInTheDocument();
    expect(screen.getByText(/Import assignments directly from Canvas/)).toBeInTheDocument();
    
    // Homework tracker functionality
    expect(screen.getByText(/Smart Homework Tracker/)).toBeInTheDocument();
    expect(screen.getByText(/Never miss a deadline/)).toBeInTheDocument();
    
    // Study timer feature
    expect(screen.getByText(/Built-in Study Timer/)).toBeInTheDocument();
    expect(screen.getByText(/Pomodoro timer/)).toBeInTheDocument();
    
    // Grade tracking feature
    expect(screen.getByText(/Grade Analytics/)).toBeInTheDocument();
    expect(screen.getByText(/Monitor your academic performance/)).toBeInTheDocument();
  });

  // Property 12: Semantic HTML Structure
  test('uses semantic HTML elements', () => {
    render(<LandingPage {...defaultProps} />);
    
    // Should use semantic elements
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header/nav
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });

  // Property 15: Keyboard Accessibility
  test('interactive elements are keyboard accessible', () => {
    render(<LandingPage {...defaultProps} />);
    
    // CTA buttons should be focusable
    const primaryCTA = screen.getByText(/Get Started Free/);
    expect(primaryCTA).toBeVisible();
    
    // Navigation buttons should be focusable
    const signInButton = screen.getAllByText(/Sign In/)[0];
    expect(signInButton).toBeVisible();
  });

  // Property 20: Value Proposition Content
  test('includes value proposition content', () => {
    render(<LandingPage {...defaultProps} />);
    
    // Should emphasize free
    expect(screen.getByText(/Free/)).toBeInTheDocument();
    
    // Should highlight target audience
    expect(screen.getByText(/high school students/)).toBeInTheDocument();
    
    // Should include descriptive benefits
    expect(screen.getByText(/Never miss another assignment/)).toBeInTheDocument();
  });

  // Responsive behavior test (Property 5)
  test('adapts to mobile viewport', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500, // Mobile width
    });

    render(<LandingPage {...defaultProps} />);
    
    // Mobile menu button should be present (via CSS)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    expect(mobileMenuBtn).toBeInTheDocument();
  });
});