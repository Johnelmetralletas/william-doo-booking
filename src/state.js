// Shared mutable state for the booking flow.
//
// `state` holds the scalars that get reassigned across modules (step index,
// edit-mode flags). They live on an object so the live values are visible to
// every module — you cannot reassign a plain imported binding from elsewhere.
// `data` is the single booking record, mutated in place as the user fills it in.

export const state = {
  cur: 1,            // current step (1–5)
  isEditing: false,  // true when editing an existing booking
  editingId: null,   // NC-XXXXXX of the booking being edited
};

export const data = {
  bookingId:'',
  title:'', date:'', dateEnd:'', multiDay:false, attendees:'', setupStart:'', startTime:'', endTime:'',
  breakdownEnd:'', description:'', groupType:'', studentGroup:false,
  groupName:'', org1:'', org1phone:'', org1email:'',
  org2:'', org2phone:'', org3:'', org3phone:'',
  avPodiumA:'', avFamiliar:'',
  clickshare:0, handheld:0, lapel:0, podiumMic:0, assistive:0, avNotes:'',
  atrium:'', food:'', foodCatering:'', alcohol:'',
  paymentType:'', paymentDept:'', paymentAcct:'', paymentContact:'', paymentEmail:'', paymentPhone:'', paymentGL:'', paymentCFC:'', paymentCC:'', paymentFund:'',
  room:'a', fpPieces:[], fpIdN:0, showPartition:true, fpTextMode:false,
  sig:'', sigDate:'', sigTitle:'', policyAccepted:false
};
