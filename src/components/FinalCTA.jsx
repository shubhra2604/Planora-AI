import ScrollSection from "./ScrollSection";
import Planner from "./Planner";

export default function FinalCTA({ user, onSignup, onLogin }) {
  return (
    <ScrollSection variant="planner-zoom" id="planner">
      <div className="planner-panel ag-float">
        <div className="planner-panel-header">
          <h2>Tell me where you want to go</h2>
          <p className="sub">
            I’ll build a day-by-day itinerary tailored to you.
          </p>
        </div>

        <Planner user={user} onSignup={onSignup} onLogin={onLogin} />
      </div>
    </ScrollSection>
  );
}
