import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo-container" [class.small]="size === 'small'" [class.large]="size === 'large'">
      <div class="logo-icon" [class.has-text]="showText">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" [attr.stroke]="'url(#' + gradientId + ')'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" [attr.stroke]="'url(#' + gradientId + ')'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" [attr.stroke]="'url(#' + gradientId + ')'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
            <linearGradient [attr.id]="gradientId" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stop-color="#4F46E5"/>
              <stop offset="1" stop-color="#8B5CF6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="logo-text" *ngIf="showText">
        <span class="gradient-text">Smart<span class="accent">Leave</span></span>
      </div>
    </div>
  `,
  styles: [`
    .logo-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 20px rgba(79, 70, 229, 0.5));
      animation: logoFloat 3s ease-in-out infinite;
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;
    }

    .logo-icon.has-text svg {
      width: 32px;
      height: 32px;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 700;
    }

    .gradient-text {
      background: linear-gradient(135deg, #4F46E5, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .accent {
      -webkit-text-fill-color: #8B5CF6;
    }

    /* Size variations */
    .small .logo-icon svg {
      width: 24px;
      height: 24px;
    }

    .small .logo-text {
      font-size: 18px;
    }

    .large .logo-icon svg {
      width: 48px;
      height: 48px;
    }

    .large .logo-text {
      font-size: 28px;
    }

    @keyframes logoFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  `]
})
export class LogoComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showText: boolean = true;
  
  gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
}