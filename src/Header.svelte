<script>
    export let title = '';
  </script>
  
  <header>
    <div class="left">
      <h1>{title}</h1>
    </div>
    
    <div class="middle">
        <div class="button-container">
          <slot name="buttons"></slot>
        </div>
    </div>
    <div class="right">
      <slot name="info"></slot>
    </div>
  </header>
  
  <style>
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background-color: #f0f0f0;
      height: 100px;
      margin-bottom: 10px;
    }
  
    .left {
      flex-grow: 1;
    }
  
    .right {
      display: flex;
      gap: 10px;
      flex-direction: column;
      align-items: flex-start;
    }

    .button-container {
      display: flex;
      gap: 10px;
    }

    .middle {
      flex-grow: 1;
      display: flex;
      justify-content: flex-start;
    }
  </style>
  