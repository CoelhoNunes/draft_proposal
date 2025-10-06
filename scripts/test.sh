#!/bin/bash

# =============================================================================
# MicroTech Platform Testing Script
# =============================================================================
# This script runs all tests for the MicroTech Platform

set -e  # Exit on any error

echo "🧪 Running MicroTech Platform Tests"
echo "===================================="

# =============================================================================
# Check if setup has been completed
# =============================================================================
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Please run setup first:"
    echo "   ./scripts/setup.sh"
    exit 1
fi

# =============================================================================
# Run different types of tests
# =============================================================================

# Parse command line arguments
COVERAGE=false
WATCH=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --coverage    Run tests with coverage report"
            echo "  --watch       Run tests in watch mode"
            echo "  --verbose     Run tests with verbose output"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# =============================================================================
# Run tests based on options
# =============================================================================

if [ "$COVERAGE" = true ]; then
    echo "📊 Running tests with coverage report..."
    pnpm test:coverage
elif [ "$WATCH" = true ]; then
    echo "👀 Running tests in watch mode..."
    pnpm test --watch
else
    echo "🧪 Running all tests..."
    if [ "$VERBOSE" = true ]; then
        pnpm test --verbose
    else
        pnpm test
    fi
fi

# =============================================================================
# Display results
# =============================================================================
echo ""
echo "✅ Tests completed!"
echo "==================="

if [ "$COVERAGE" = true ]; then
    echo "📊 Coverage report generated in coverage/ directory"
    echo "   Open coverage/index.html in your browser to view detailed report"
fi

echo ""
echo "💡 Additional test commands:"
echo "   pnpm test                    # Run all tests"
echo "   pnpm test:coverage           # Run tests with coverage"
echo "   pnpm --filter web test       # Test only web app"
echo "   pnpm --filter api test       # Test only API"
echo "   pnpm lint                    # Run linting"
echo "   pnpm typecheck               # Run type checking"
