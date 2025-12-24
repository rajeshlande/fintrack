// Responsive Design Test Utility
// This utility helps test responsive design across different screen sizes

export const responsiveBreakpoints = {
  mobile: '640px',
  tablet: '768px', 
  desktop: '1024px',
  large: '1280px'
}

export const testResponsiveDesign = () => {
  const tests = [
    {
      name: 'Mobile View (320px - 639px)',
      minWidth: 320,
      maxWidth: 639,
      checks: [
        'Header navigation stacks vertically',
        'Summary cards show 1-2 columns',
        'Transaction items stack information',
        'Filter buttons are compact',
        'Text sizes are appropriate for mobile'
      ]
    },
    {
      name: 'Tablet View (640px - 1023px)', 
      minWidth: 640,
      maxWidth: 1023,
      checks: [
        'Header shows side-by-side layout',
        'Summary cards show 2 columns',
        'Transaction items show inline information',
        'Filters expand to show more options',
        'Text sizes increase appropriately'
      ]
    },
    {
      name: 'Desktop View (1024px+)',
      minWidth: 1024,
      maxWidth: null,
      checks: [
        'Header shows full navigation',
        'Summary cards show 4 columns',
        'Transaction items show full details',
        'All filter options are visible',
        'Maximum information density'
      ]
    }
  ]

  const currentWidth = window.innerWidth
  const currentTest = tests.find(test => 
    currentWidth >= test.minWidth && 
    (test.maxWidth === null || currentWidth <= test.maxWidth)
  )

  if (currentTest) {
    console.log(`🎯 Responsive Test: ${currentTest.name}`)
    console.log(`📱 Current width: ${currentWidth}px`)
    console.log('✅ Checks to verify:')
    currentTest.checks.forEach((check, index) => {
      console.log(`   ${index + 1}. ${check}`)
    })
    
    // Add visual indicators
    addResponsiveIndicators(currentWidth, currentTest)
  }
}

const addResponsiveIndicators = (width, test) => {
  // Remove existing indicators
  const existingIndicators = document.querySelectorAll('.responsive-indicator')
  existingIndicators.forEach(indicator => indicator.remove())

  // Create indicator element
  const indicator = document.createElement('div')
  indicator.className = 'responsive-indicator fixed top-4 right-4 z-50 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-mono'
  indicator.innerHTML = `
    <div>📱 ${width}px</div>
    <div>🎯 ${test.name}</div>
  `
  
  document.body.appendChild(indicator)
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator)
    }
  }, 5000)
}

export const simulateDevice = (width) => {
  // Temporarily resize the viewport for testing
  const originalWidth = window.innerWidth
  
  // Create a resize event
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  
  window.dispatchEvent(new Event('resize'))
  
  console.log(`📱 Simulating device width: ${width}px`)
  testResponsiveDesign()
  
  // Restore original width after 3 seconds
  setTimeout(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    })
    window.dispatchEvent(new Event('resize'))
    console.log(`🔙 Restored original width: ${originalWidth}px`)
  }, 3000)
}

export const testCommonDevices = () => {
  const devices = [
    { name: 'iPhone SE', width: 375 },
    { name: 'iPhone 12', width: 390 },
    { name: 'iPad', width: 768 },
    { name: 'iPad Pro', width: 1024 },
    { name: 'Desktop', width: 1280 }
  ]
  
  console.log('📱 Testing common device sizes:')
  devices.forEach((device, index) => {
    setTimeout(() => {
      console.log(`\n🔍 Testing ${device.name} (${device.width}px):`)
      simulateDevice(device.width)
    }, index * 4000)
  })
}

// Auto-run responsive test when module is imported
if (typeof window !== 'undefined') {
  // Run test on load
  window.addEventListener('load', () => {
    setTimeout(testResponsiveDesign, 1000)
  })
  
  // Run test on resize
  let resizeTimeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(testResponsiveDesign, 500)
  })
}