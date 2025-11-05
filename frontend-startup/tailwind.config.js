
module.exports = {

  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-out forwards', // <--- ADICIONE ESTA
        'slide-up-modal': 'slideUpModal 0.3s ease-out forwards',
        'slide-down-modal': 'slideDownModal 0.3s ease-out forwards', // <--- ADICIONE ESTA
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // 👇 ADICIONE ESTES KEYFRAMES 👇
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUpModal: {
          '0%': { transform: 'translateY(20px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        // 👇 ADICIONE ESTES KEYFRAMES 👇
        slideDownModal: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(20px) scale(0.98)', opacity: '0' },
        },
      },
    },
  },
 
};