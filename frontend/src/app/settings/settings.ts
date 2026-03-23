import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { LogoComponent } from '../components/logo/logo.component';

interface UserSettings {
  masterSound: boolean;
  volume: number;
  vibration: boolean;
  notificationDuration: number;
  selectedSound: string;
  theme: string;
  dateFormat: string;
  compactView: boolean;
  dailyDigest: boolean;
  digestTime: string;
  emailNotifications: boolean;
  showProfileToTeam: boolean;
  showEmailToTeam: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoComponent],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  settings: UserSettings = {
    masterSound: true,
    volume: 24,  // Changed from 70 to 24
    vibration: true,
    notificationDuration: 30,
    selectedSound: 'chime',
    theme: 'Dark',
    dateFormat: 'YYYY-MM-DD',
    compactView: false,
    dailyDigest: false,
    digestTime: '09:00',
    emailNotifications: true,
    showProfileToTeam: true,
    showEmailToTeam: true
  };

  soundOptions = [
    { value: 'chime', label: 'Soft Chime' },
    { value: 'ping', label: 'Gentle Ping' },
    { value: 'bell', label: 'Office Bell' },
    { value: 'notification', label: 'Modern Alert' },
    { value: 'calm', label: 'Calm Tone' }
  ];

  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private reverbNode: ConvolverNode | null = null;

  saving = false;
  showSuccess = false;
  userName = '';
  isDarkTheme = false;

  constructor(
    private authService: Auth,
    private router: Router
  ) {
    this.loadSettings();
    this.initAudio();
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = this.authService.currentUser?.name || 'User';
    this.applyTheme(this.settings.theme);
  }

  initAudio(): void {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.createReverb();
  }

  createReverb(): void {
    if (!this.audioContext) return;
    
    // Create a reverb effect for a richer, more professional sound
    const reverb = this.audioContext.createConvolver();
    const length = this.audioContext.sampleRate * 1.5; // 1.5 second reverb
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay for natural reverb
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    reverb.buffer = impulse;
    this.reverbNode = reverb;
  }

  // Professional sounds with reverb effect
  generateChimeSound(volume: number): void {
    if (!this.audioContext || !this.reverbNode) return;
    
    const now = this.audioContext.currentTime;
    const volumeGain = this.audioContext.createGain();
    volumeGain.gain.value = volume / 100;
    
    // Add reverb
    volumeGain.connect(this.reverbNode);
    this.reverbNode.connect(this.audioContext.destination);
    
    // Main chime - warm and professional
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 587.33; // D5
    osc.connect(volumeGain);
    osc.start(now);
    osc.stop(now + 0.6);
    
    // Second harmonic for richness
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 783.99; // G5
    osc2.connect(volumeGain);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
    
    // Envelope for smooth fade
    volumeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  }

  generatePingSound(volume: number): void {
    if (!this.audioContext || !this.reverbNode) return;
    
    const now = this.audioContext.currentTime;
    const volumeGain = this.audioContext.createGain();
    volumeGain.gain.value = volume / 100;
    
    volumeGain.connect(this.reverbNode);
    this.reverbNode.connect(this.audioContext.destination);
    
    // Clean, professional ping
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880; // A5
    osc.connect(volumeGain);
    osc.start(now);
    osc.stop(now + 0.3);
    
    // Subtle harmonic
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1320; // E6
    osc2.connect(volumeGain);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.25);
    
    volumeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  }

  generateBellSound(volume: number): void {
    if (!this.audioContext || !this.reverbNode) return;
    
    const now = this.audioContext.currentTime;
    const volumeGain = this.audioContext.createGain();
    volumeGain.gain.value = volume / 100;
    
    volumeGain.connect(this.reverbNode);
    this.reverbNode.connect(this.audioContext.destination);
    
    // Classic office bell sound
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 523.25; // C5
    osc.connect(volumeGain);
    osc.start(now);
    osc.stop(now + 0.5);
    
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 659.25; // E5
    osc2.connect(volumeGain);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
    
    const osc3 = this.audioContext.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 783.99; // G5
    osc3.connect(volumeGain);
    osc3.start(now + 0.2);
    osc3.stop(now + 0.3);
    
    volumeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  }

  generateNotificationSound(volume: number): void {
    if (!this.audioContext || !this.reverbNode) return;
    
    const now = this.audioContext.currentTime;
    const volumeGain = this.audioContext.createGain();
    volumeGain.gain.value = volume / 100;
    
    volumeGain.connect(this.reverbNode);
    this.reverbNode.connect(this.audioContext.destination);
    
    // Modern, subtle notification
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 659.25; // E5
    osc.connect(volumeGain);
    osc.start(now);
    osc.stop(now + 0.25);
    
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 523.25; // C5
    osc2.connect(volumeGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.37);
    
    volumeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  }

  generateCalmSound(volume: number): void {
    if (!this.audioContext || !this.reverbNode) return;
    
    const now = this.audioContext.currentTime;
    const volumeGain = this.audioContext.createGain();
    volumeGain.gain.value = volume / 100;
    
    volumeGain.connect(this.reverbNode);
    this.reverbNode.connect(this.audioContext.destination);
    
    // Softer, calming tone
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440; // A4
    osc.connect(volumeGain);
    osc.start(now);
    osc.stop(now + 0.7);
    
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 554.37; // C#5
    osc2.connect(volumeGain);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.5);
    
    volumeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  }

  playTestSound(): void {
    if (!this.settings.masterSound) {
      alert('Master sound is disabled. Please enable it first.');
      return;
    }
    
    if (!this.audioContext) {
      this.initAudio();
    }
    
    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    
    const volume = this.settings.volume;
    
    switch (this.settings.selectedSound) {
      case 'chime':
        this.generateChimeSound(volume);
        break;
      case 'ping':
        this.generatePingSound(volume);
        break;
      case 'bell':
        this.generateBellSound(volume);
        break;
      case 'notification':
        this.generateNotificationSound(volume);
        break;
      case 'calm':
        this.generateCalmSound(volume);
        break;
      default:
        this.generateChimeSound(volume);
    }
  }

  loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
      
      const savedVolume = localStorage.getItem('notificationVolume');
      if (savedVolume) {
        this.settings.volume = parseInt(savedVolume);
      }
      
      this.applyTheme(this.settings.theme);
      this.applyDateFormat(this.settings.dateFormat);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  saveSettings(): void {
    this.saving = true;
    
    try {
      localStorage.setItem('userSettings', JSON.stringify(this.settings));
      localStorage.setItem('notificationVolume', this.settings.volume.toString());
      localStorage.setItem('notificationDuration', this.settings.notificationDuration.toString());
      
      this.applyTheme(this.settings.theme);
      this.applyDateFormat(this.settings.dateFormat);
      
      // Test the selected sound on save
      if (this.settings.masterSound) {
        setTimeout(() => this.playTestSound(), 100);
      }
      
      if (this.settings.vibration && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      this.saving = false;
    }
  }

  resetToDefault(): void {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.settings = {
        masterSound: true,
        volume: 24,  // Changed from 70 to 24
        vibration: true,
        notificationDuration: 30,
        selectedSound: 'chime',
        theme: 'Dark',
        dateFormat: 'YYYY-MM-DD',
        compactView: false,
        dailyDigest: false,
        digestTime: '09:00',
        emailNotifications: true,
        showProfileToTeam: true,
        showEmailToTeam: true
      };
      
      this.saveSettings();
    }
  }

  applyTheme(theme: string): void {
    if (theme === 'Dark') {
      document.body.classList.add('dark-theme');
      this.isDarkTheme = true;
    } else if (theme === 'Light') {
      document.body.classList.remove('dark-theme');
      this.isDarkTheme = false;
    } else if (theme === 'Auto') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDarkMode) {
        document.body.classList.add('dark-theme');
        this.isDarkTheme = true;
      } else {
        document.body.classList.remove('dark-theme');
        this.isDarkTheme = false;
      }
    }
    
    localStorage.setItem('theme', theme);
  }

  applyDateFormat(format: string): void {
    localStorage.setItem('dateFormat', format);
    window.dispatchEvent(new CustomEvent('dateFormatChanged', { detail: format }));
  }

  testVibration(): void {
    if (this.settings.vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    } else {
      alert('Vibration not supported on this device');
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleTheme(): void {
    this.settings.theme = this.settings.theme === 'Dark' ? 'Light' : 'Dark';
    this.applyTheme(this.settings.theme);
  }
}