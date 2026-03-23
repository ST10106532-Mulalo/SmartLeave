import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions } from '@fullcalendar/core';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  template: `
    <div class="calendar-container glass">
      <h3>📅 Select Dates</h3>
      <full-calendar
        [options]="calendarOptions"
      ></full-calendar>
      <div class="calendar-footer">
        <div class="tip">
          <span class="tip-icon">💡</span>
          <span>Click any date to select it for your leave request</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      background: rgba(10, 20, 30, 0.5);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 24px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }
    
    .calendar-container:hover {
      border-color: #00ffff;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
    }
    
    .calendar-container h3 {
      margin: 0 0 1rem 0;
      color: #00ffff;
      font-size: 1.2rem;
      text-align: center;
      font-weight: 600;
    }
    
    :host ::ng-deep .fc {
      background: transparent;
    }
    
    :host ::ng-deep .fc th {
      color: #00ffff;
      padding: 0.75rem 0;
      font-weight: 500;
      background: rgba(0, 255, 255, 0.05);
      border: none;
    }
    
    :host ::ng-deep .fc-day {
      cursor: pointer;
      transition: all 0.2s;
    }
    
    :host ::ng-deep .fc-day:hover {
      background: rgba(0, 255, 255, 0.15);
      border-radius: 8px;
      transform: scale(1.02);
    }
    
    :host ::ng-deep .fc-day-today {
      background: rgba(0, 255, 255, 0.2) !important;
      border-radius: 8px;
    }
    
    :host ::ng-deep .fc-daygrid-day-number {
      color: #fff;
      font-size: 0.9rem;
      padding: 4px;
    }
    
    :host ::ng-deep .fc-col-header-cell-cushion {
      color: #00ffff;
      text-decoration: none;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.8rem;
    }
    
    :host ::ng-deep .fc .fc-button {
      background: rgba(0, 255, 255, 0.1);
      border: 1px solid rgba(0, 255, 255, 0.3);
      color: #00ffff;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    :host ::ng-deep .fc .fc-button:hover {
      background: rgba(0, 255, 255, 0.3);
      border-color: #00ffff;
      transform: scale(1.05);
    }
    
    :host ::ng-deep .fc .fc-button-primary:not(:disabled).fc-button-active,
    :host ::ng-deep .fc .fc-button-primary:not(:disabled):active {
      background: linear-gradient(135deg, #00ffff, #ff00ff);
      border-color: transparent;
      color: white;
    }
    
    :host ::ng-deep .fc-toolbar-title {
      color: #ff00ff;
      font-size: 1rem;
      font-weight: 600;
    }
    
    :host ::ng-deep .fc-daygrid-day-frame {
      padding: 4px;
    }
    
    .calendar-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 255, 255, 0.2);
    }
    
    .tip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #8892b0;
      font-size: 0.8rem;
      justify-content: center;
    }
    
    .tip-icon {
      font-size: 1rem;
      color: #00ffff;
    }
  `]
})
export class CalendarComponent {
  @Output() dateSelected = new EventEmitter<Date>();
  
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next'
    },
    height: 'auto',
    dayMaxEvents: true,
    dateClick: (info) => {
      this.dateSelected.emit(info.date);
    },
    firstDay: 1,
    buttonText: {
      prev: '‹',
      next: '›'
    },
    titleFormat: { month: 'long', year: 'numeric' }
  };
}