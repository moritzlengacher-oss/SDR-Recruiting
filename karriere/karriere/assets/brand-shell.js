/* Original L&P navigation runtime, isolated from lead/newsletter modules. */
(()=>{'use strict';
const desktopNavQuery=window.matchMedia('(min-width: 1101px)');
const dropdownItems = Array.from(document.querySelectorAll('.site-nav .has-dropdown'));

  function closeDropdown(item) {
    item.classList.remove('nav-dropdown-open');
    const toggle = item.querySelector(':scope > .nav-dropdown-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `${toggle.dataset.navLabel || 'Navigation'} Untermenü öffnen`);
    }
  }

  function closeOtherDropdowns(currentItem) {
    dropdownItems.forEach((item) => {
      if (item !== currentItem) closeDropdown(item);
    });
  }

  dropdownItems.forEach((item) => {
    const parent = item.querySelector(':scope > .nav-parent');
    const dropdown = item.querySelector(':scope > .nav-dropdown');
    const label = parent?.textContent.replace('▾', '').trim().replace(/\s+/g, ' ') || 'Navigation';
    const dropdownId = dropdown?.id || `nav-dropdown-${dropdownItems.indexOf(item) + 1}`;
    let dropdownToggle = item.querySelector(':scope > .nav-dropdown-toggle');
    let closeTimer;

    if (dropdown) dropdown.id = dropdownId;
    if (!dropdownToggle && parent && dropdown) {
      dropdownToggle = document.createElement('button');
      dropdownToggle.className = 'nav-dropdown-toggle';
      dropdownToggle.type = 'button';
      dropdownToggle.setAttribute('aria-label', `${label} Untermenü öffnen`);
      dropdownToggle.setAttribute('aria-controls', dropdownId);
      const caret = parent.querySelector('.nav-caret');
      if (caret) dropdownToggle.appendChild(caret);
      else dropdownToggle.innerHTML = '<span aria-hidden="true" class="nav-caret">▾</span>';
      parent.after(dropdownToggle);
    }
    if (dropdownToggle) dropdownToggle.dataset.navLabel = label;
    parent?.removeAttribute('aria-haspopup');
    parent?.removeAttribute('aria-expanded');
    dropdownToggle?.setAttribute('aria-expanded', 'false');

    function openDropdown() {
      if (!desktopNavQuery.matches) return;
      window.clearTimeout(closeTimer);
      closeOtherDropdowns(item);
      item.classList.add('nav-dropdown-open');
      if (dropdownToggle) {
        dropdownToggle.setAttribute('aria-expanded', 'true');
        dropdownToggle.setAttribute('aria-label', `${label} Untermenü schliessen`);
      }
    }

    function scheduleClose() {
      if (!desktopNavQuery.matches) return;
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => closeDropdown(item), 260);
    }

    item.addEventListener('pointerenter', openDropdown);
    item.addEventListener('pointerleave', scheduleClose);
    item.addEventListener('focusin', (event) => {
      if (event.target !== dropdownToggle) openDropdown();
    });
    item.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!item.contains(document.activeElement)) closeDropdown(item);
      }, 0);
    });

    dropdownToggle?.addEventListener('click', (event) => {
      if (!desktopNavQuery.matches) return;
      event.preventDefault();
      event.stopPropagation();
      if (item.matches(':hover')) {
        openDropdown();
        return;
      }
      if (item.classList.contains('nav-dropdown-open')) closeDropdown(item);
      else openDropdown();
    });

    dropdownToggle?.addEventListener('keydown', (event) => {
      if (!desktopNavQuery.matches || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopPropagation();
      if (item.classList.contains('nav-dropdown-open')) closeDropdown(item);
      else openDropdown();
    });

    item.querySelectorAll('.nav-dropdown a').forEach((link) => {
      link.addEventListener('click', () => closeDropdown(item));
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!desktopNavQuery.matches) return;
    if (!event.target.closest || event.target.closest('.site-nav .has-dropdown')) return;
    dropdownItems.forEach(closeDropdown);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dropdownItems.forEach(closeDropdown);
  });

  const resetDropdowns = () => {
    dropdownItems.forEach(closeDropdown);
  };

  if (desktopNavQuery.addEventListener) {
    desktopNavQuery.addEventListener('change', resetDropdowns);
  } else if (desktopNavQuery.addListener) {
    desktopNavQuery.addListener(resetDropdowns);
  }

  function initMobileNavigation() {
    const nav = document.querySelector('.site-nav');
    const navToggle = nav?.querySelector('.nav-toggle');
    const navLinks = nav?.querySelector('.nav-links');
    if (!nav) return;

    if (nav.dataset.lpHeightBound !== 'true') {
      nav.dataset.lpHeightBound = 'true';
      const syncNavHeight = () => {
        document.documentElement.style.setProperty('--site-nav-height', `${Math.ceil(nav.getBoundingClientRect().height)}px`);
      };
      syncNavHeight();
      window.addEventListener('resize', syncNavHeight, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(syncNavHeight).observe(nav);
    }

    if (!navToggle || !navLinks || navToggle.dataset.lpNavBound === 'true') return;

    navToggle.dataset.lpNavBound = 'true';
    const mobileQuery = window.matchMedia('(max-width: 1100px)');

    function setMenuOpen(open) {
      navLinks.classList.toggle('open', open);
      navToggle.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
      document.body.classList.toggle('nav-open', open);
      if (!open) {
        navLinks.querySelectorAll('.mobile-dropdown-open').forEach((item) => item.classList.remove('mobile-dropdown-open'));
        navLinks.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', `${toggle.dataset.navLabel || 'Navigation'} Untermenü öffnen`);
        });
      }
    }

    navToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      setMenuOpen(!navLinks.classList.contains('open'));
    }, true);

    navLinks.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
      toggle.setAttribute('aria-expanded', 'false');
    });

    navLinks.addEventListener('click', (event) => {
      const dropdownToggle = event.target.closest?.('.nav-dropdown-toggle');
      if (dropdownToggle && mobileQuery.matches) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const item = dropdownToggle.closest('.has-dropdown');
        const open = !item.classList.contains('mobile-dropdown-open');
        navLinks.querySelectorAll('.mobile-dropdown-open').forEach((other) => {
          if (other !== item) {
            other.classList.remove('mobile-dropdown-open');
            const otherToggle = other.querySelector(':scope > .nav-dropdown-toggle');
            if (otherToggle) {
              otherToggle.setAttribute('aria-expanded', 'false');
              otherToggle.setAttribute('aria-label', `${otherToggle.dataset.navLabel || 'Navigation'} Untermenü öffnen`);
            }
          }
        });
        item.classList.toggle('mobile-dropdown-open', open);
        dropdownToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        dropdownToggle.setAttribute('aria-label', `${dropdownToggle.dataset.navLabel || 'Navigation'} Untermenü ${open ? 'schliessen' : 'öffnen'}`);
        return;
      }

      if (event.target.closest?.('a[href]')) setMenuOpen(false);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    });

    const resetForViewport = () => {
      if (!mobileQuery.matches) setMenuOpen(false);
    };

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', resetForViewport);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(resetForViewport);
    }
  }

  initMobileNavigation();

  

const navElement=document.querySelector('.site-nav');
const updateScrolled=()=>navElement?.classList.toggle('scrolled',window.scrollY>60);
window.addEventListener('scroll',updateScrolled,{passive:true});updateScrolled();
const overlay=document.getElementById('search-overlay');
const input=document.getElementById('search-input');
const results=document.getElementById('search-results');
const empty=document.getElementById('search-empty');
const hint=document.getElementById('search-hint');
if(!overlay||!input||!results||!empty||!hint)return;
const triggers=[...document.querySelectorAll('.nav-search-btn')];
let searchIndex=null,active=-1,lastTrigger=null;
const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de-CH');
const validHref=raw=>{try{const u=new URL(raw,location.origin);return (u.protocol==='https:'&&(u.origin===location.origin||u.origin==='https://www.lengacher-partner.ch'))||(u.origin===location.origin&&location.hostname==='localhost');}catch{return false;}};
async function loadIndex(){
 if(searchIndex)return searchIndex;
 try{const response=await fetch('/assets/lp-brand/search-index.json',{headers:{Accept:'application/json'}});if(!response.ok)throw Error('search');const data=await response.json();if(!Array.isArray(data))throw Error('search');searchIndex=data.filter(x=>x&&typeof x.title==='string'&&validHref(x.url));}
 catch{searchIndex=[...document.querySelectorAll('.site-nav a[href],.site-footer a[href],.job-card h3 a[href]')].map(a=>({type:'Seite',title:a.textContent.trim(),desc:'',url:a.href})).filter(x=>x.title&&validHref(x.url));}
 return searchIndex;
}
function focusResult(index){const rows=[...results.querySelectorAll('a.search-result')];if(!rows.length)return;active=(index+rows.length)%rows.length;rows.forEach((row,i)=>{row.classList.toggle('active',i===active);row.classList.toggle('selected',i===active);});rows[active].focus();}
async function renderSearch(){
 const query=input.value.trim();const index=await loadIndex();if(query!==input.value.trim())return;
 const words=normalize(query).split(/\s+/).filter(Boolean);results.replaceChildren();active=-1;
 if(!words.length){empty.hidden=true;hint.hidden=false;return;}
 const hits=index.filter(x=>words.every(w=>normalize([x.title,x.desc,x.keywords].join(' ')).includes(w))).slice(0,15);
 hint.hidden=true;empty.hidden=hits.length!==0;
 for(const item of hits){const link=document.createElement('a');link.className='search-result';link.href=item.url;const type=document.createElement('span');type.className='search-result-type';type.textContent=item.type||'Seite';const title=document.createElement('span');title.className='search-result-title';title.textContent=item.title;const description=document.createElement('span');description.className='search-result-desc';description.textContent=item.desc||'';link.append(type,title,description);results.append(link);}
}
function closeSearch(){
 overlay.classList.remove('active');overlay.hidden=true;overlay.inert=true;overlay.setAttribute('aria-hidden','true');document.body.style.overflow='';input.value='';results.replaceChildren();empty.hidden=true;hint.hidden=false;
 triggers.forEach(b=>b.setAttribute('aria-expanded','false'));if(lastTrigger?.isConnected)lastTrigger.focus();
}
function openSearch(trigger){
 if(document.body.classList.contains('nav-open'))document.querySelector('.nav-toggle')?.click();
 lastTrigger=trigger||document.activeElement;overlay.hidden=false;overlay.inert=false;overlay.removeAttribute('inert');overlay.setAttribute('aria-hidden','false');overlay.classList.add('active');document.body.style.overflow='hidden';triggers.forEach(b=>b.setAttribute('aria-expanded','true'));input.focus();void loadIndex();
}
triggers.forEach(b=>{b.setAttribute('aria-controls','search-overlay');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');b.addEventListener('click',()=>openSearch(b));});
overlay.querySelector('.search-close')?.addEventListener('click',closeSearch);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeSearch();});
input.addEventListener('input',renderSearch);
document.addEventListener('keydown',e=>{
 if(overlay.hidden)return;
 if(e.key==='Escape'){e.preventDefault();closeSearch();return;}
 if(e.key==='ArrowDown'){e.preventDefault();focusResult(active+1);}
 if(e.key==='ArrowUp'){e.preventDefault();focusResult(active-1);}
 if(e.key==='Tab'){const focusable=[...overlay.querySelectorAll('input,button,a[href]')].filter(x=>!x.hidden);const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});

})();
