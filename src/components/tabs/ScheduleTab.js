import React from 'react';
import { fmt12 } from '../../utils/helpers';

function ScheduleTab({ classes, setSchoolWiz, setAddingC, delClass }) {
  // Only show weekdays (Mon-Fri)
  const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri"];
  
  // Generate time slots from 7:00 AM to 4:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 16; hour++) {
      const time12 = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
      slots.push({
        hour,
        time24: `${hour.toString().padStart(2, '0')}:00`,
        time12
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Convert time string to minutes from midnight for positioning
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculate position and height for class blocks
  const getBlockStyle = (startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const gridStartMinutes = 7 * 60; // 7:00 AM in minutes
    const pixelsPerMinute = 52 / 60; // 52px per hour
    
    const top = (startMinutes - gridStartMinutes) * pixelsPerMinute;
    const height = (endMinutes - startMinutes) * pixelsPerMinute;
    
    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(20, height)}px`
    };
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  // Create unique classes for the left panel (deduplicated by name only)
  const uniqueClassNames = [...new Set(classes.map(c => c.name))];
  const uniqueClasses = uniqueClassNames.map(name => {
    const firstClass = classes.find(c => c.name === name);
    const allDaysForClass = classes.filter(c => c.name === name).flatMap(c => c.days);
    const uniqueDays = [...new Set(allDaysForClass)];
    
    return {
      ...firstClass,
      days: uniqueDays
    };
  });

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">Class Schedule</div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-g btn-sm" onClick={()=>setSchoolWiz({step:"search",query:"",results:null,school:null,numPeriods:7,periods:[],currentPeriod:0})}>🏫 Import from School</button>
          <button className="btn btn-p btn-sm" onClick={()=>setAddingC(true)}>＋ Add Class</button>
        </div>
      </div>
      
      {uniqueClasses.length === 0 ? (
        <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
          <div className="empty-i">🏫</div>
          <div className="empty-t">No classes yet</div>
          <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8,marginBottom:18}}>Add your class schedule to see it here</div>
          <button className="btn btn-p" onClick={()=>setAddingC(true)}>＋ Add First Class</button>
        </div>
      ) : (
        <div className="sched-layout">
          {/* Left side - Class list */}
          <div className="sc-classes">
            {uniqueClasses.map((c, index) => (
              <div key={`${c.name}-${index}`} className="sc-card" style={{position:"relative"}}>
                <div className="tcdot" style={{background:c.color}}/>
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div className="tcname">{c.name}</div>
                    {c.room && <div className="tcroom">📍 {c.room}</div>}
                  </div>
                  <div className="tctime">
                    {fmt12(c.startTime)} - {fmt12(c.endTime)}
                  </div>
                </div>
                <button 
                  onClick={() => delClass(c.id)}
                  style={{
                    position:"absolute",
                    right:-6,
                    top:-6,
                    width:20,
                    height:20,
                    borderRadius:"50%",
                    border:"none",
                    background:"#ef4444",
                    color:"#fff",
                    fontSize:".7rem",
                    cursor:"pointer",
                    opacity:0,
                    transition:"opacity 0.2s",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    zIndex:10
                  }}
                  className="schedule-delete-btn"
                  title="Delete class"
                  onMouseEnter={(e) => e.target.style.opacity = 1}
                  onMouseLeave={(e) => e.target.style.opacity = 0}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Right side - Timetable grid */}
          <div className="sgrid">
            {/* Header with days */}
            <div className="shdr" style={{gridTemplateColumns:`48px repeat(${WEEKDAYS.length}, 1fr)`}}>
              <div className="shcell"></div>
              {WEEKDAYS.map(day => (
                <div key={day} className={`shcell ${day === today ? 'tdy' : ''}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Grid body */}
            <div className="sgrid-body" style={{gridTemplateColumns:`48px repeat(${WEEKDAYS.length}, 1fr)`}}>
              {/* Time column */}
              <div className="sgrid-times">
                {timeSlots.map(slot => (
                  <div key={slot.hour} className="stime-row">
                    {slot.time12}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {WEEKDAYS.map(day => {
                // Get all classes for this specific day (don't deduplicate here)
                const dayClasses = classes.filter(c => c.days.includes(day));
                
                return (
                  <div key={day} className={`sgrid-daycol ${day === today ? 'tdy' : ''}`}>
                    {/* Hour lines */}
                    {timeSlots.map((slot, index) => (
                      <div 
                        key={slot.hour} 
                        className="sgrid-hrline" 
                        style={{top: `${index * 52}px`}}
                      />
                    ))}
                    
                    {/* Class blocks - each class gets its own block */}
                    {dayClasses.map((c, index) => {
                      const blockStyle = getBlockStyle(c.startTime, c.endTime);
                      return (
                        <div
                          key={`${c.id}-${day}-${index}`}
                          className="cblock"
                          style={{
                            ...blockStyle,
                            background: c.color
                          }}
                          title={`${c.name} (${fmt12(c.startTime)} - ${fmt12(c.endTime)})`}
                        >
                          <div style={{fontSize:'.64rem',fontWeight:700,lineHeight:1.2}}>
                            {c.name}
                          </div>
                          {c.room && (
                            <div style={{fontSize:'.58rem',opacity:0.9,marginTop:1}}>
                              {c.room}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .sc-card:hover .schedule-delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

export default ScheduleTab;