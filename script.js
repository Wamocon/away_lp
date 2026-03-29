/* AWAY Landing Page - Interactive Logic */

(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* 1. REVEAL ON SCROLL */
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
        }
      });
    }, { threshold: 0.1 });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* 2. ROI CALCULATOR */
  function initROICalculator() {
    var empSlider = $('#employee-slider');
    var reqSlider = $('#request-slider');
    var empLabel = $('#employee-count-label');
    var reqLabel = $('#request-count-label');
    var savingsValue = $('#savings-value');
    var hoursValue = $('#hours-value');

    if (!empSlider || !reqSlider) return;

    function updateCalculations() {
      var employees = parseInt(empSlider.value);
      var requests = parseInt(reqSlider.value);
      
      empLabel.textContent = employees;
      reqLabel.textContent = requests;

      /* Logic: 1 request takes ~30 mins (0.5h) manually. AWAY reduces it to ~5 mins. 
         Saving = 25 mins (0.41h) per request.
         Cost per hour = ~50 € (average overhead).
      */
      var hoursSaved = employees * requests * 0.41;
      var moneySaved = hoursSaved * 50;

      // Format currency
      var formattedMoney = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(moneySaved);
      
      savingsValue.textContent = formattedMoney;
      hoursValue.textContent = Math.round(hoursSaved) + ' Arbeitsstunden';
      
      // Animate scaling for visual feedback
      savingsValue.style.transform = 'scale(1.05)';
      setTimeout(() => savingsValue.style.transform = 'scale(1)', 100);
    }

    empSlider.addEventListener('input', updateCalculations);
    reqSlider.addEventListener('input', updateCalculations);
    
    updateCalculations();
  }

  /* 3. NAV SCROLL EFFECT */
  function initNav() {
    var nav = $('#nav');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            nav.classList.add('bg-white/80', 'backdrop-blur-xl', 'shadow-md', 'py-3');
            nav.classList.remove('py-4');
        } else {
            nav.classList.remove('bg-white/80', 'backdrop-blur-xl', 'shadow-md', 'py-3');
            nav.classList.add('py-4');
        }
    });
  }

  /* 4. SMOOTH SCROLLING */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = $(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
  }

  /* INITIALIZE ALL */
  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initROICalculator();
    initNav();
    initSmoothScroll();
  });

})();
