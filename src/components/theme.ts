export class ThemeComponent {
  private chartManager?: any;
  constructor(chartManager?: any) {
    this.chartManager = chartManager;
  }

  initialize() {
    const themeSwitch = document.getElementById('theme-switch')!;
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'light') {
      themeSwitch.classList.add('active');
    }

    themeSwitch.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      html.setAttribute('data-theme', newTheme);
      themeSwitch.classList.toggle('active');
      localStorage.setItem('theme', newTheme);

      if (this.chartManager) {
        this.chartManager.updateTheme(newTheme);
      }
    });
  }
}
