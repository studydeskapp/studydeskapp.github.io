import React from 'react';
import { fmt12 } from '../../utils/helpers';
import { DAYS } from '../../constants';

function ScheduleTab({ classes, setSchoolWiz, setAddingC }) {
  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">Class Schedule</div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-g btn-sm" onClick={()=>setSchoolWiz({step:"search",query:"",results:null,school:null,numPeriods:7,periods:[],currentPeriod:0})}>🏫 Import from School</button>
          <button className="btn btn-p btn-sm" onClick={()=>setAddingC(true)}>＋ Add Class</button>
        </div>
      </div>
      
      {classes.length === 0 ? (
        <div className="empty" style={{background:"var(--card)",border:"1.5px dashed var(--border2)",borderRadius:18,padding:"52px 20px"}}>
          <div className="empty-i">🏫</div>
          <div className="empty-t">No classes yet</div>
          <div style={{fontSize:".78rem",color:"var(--text4)",marginTop:8,marginBottom:18}}>Add your class schedule to see it here</div>
          <button className="btn btn-p" onClick={()=>setAddingC(true)}>＋ Add First Class</button>
        </div>
      ) : (
        <div className="schedule-grid">
          {DAYS.map(day => {
            const dayClasses = classes.filter(c => c.days.includes(day));
            return (
              <div key={day} className="schedule-day" style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,padding:16,marginBottom:12}}>
                <div style={{fontWeight:700,color:"var(--text)",marginBottom:12,fontSize:".9rem"}}>{day}</div>
                {dayClasses.length === 0 ? (
                  <div style={{color:"var(--text3)",fontSize:".8rem"}}>No classes</div>
                ) : (
                  dayClasses.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(c => (
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:12,height:12,borderRadius:"50%",background:c.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:".85rem",color:"var(--text)"}}>{c.name}</div>
                        {c.room && <div style={{fontSize:".75rem",color:"var(--text3)"}}>📍 {c.room}</div>}
                      </div>
                      <div style={{fontSize:".75rem",color:"var(--text3)",textAlign:"right"}}>
                        {fmt12(c.startTime)}<br/>
                        {fmt12(c.endTime)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScheduleTab;