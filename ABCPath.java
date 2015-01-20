public class ABCPath
{
  
  public int length(String []input)
  {
    char [][]g;
    boolean [][]cur,pre,tmp;
    int W,L,i,j,k,x,y,cnt;
    int [][]v=new int[8][2];
    k=0;
    for(i=-1;i<=1;i++)
    for(j=-1;j<=1;j++)
    if(i!=0 || j!=0)
    {
      v[k][0]=i;
      v[k][1]=j;
      k++;
    }
    char ch;
    boolean one;
    W=input.length;
    L=input[0].length();
    g=new char[W][L];
    for(i=0;i<W;i++)
    for(j=0;j<L;j++)
    {
      g[i][j]=input[i].charAt(j);
    }
    cur=new boolean[W][L];
    pre=new boolean[W][L];
    one=false;
    for(i=0;i<W;i++)
    for(j=0;j<L;j++)
    {
      if(g[i][j]=='A')
      {
        cur[i][j]=true;
        one=true;  
      }
      else
      {
        cur[i][j]=false;
      }
    }
    if(!one) return 0;
    cnt=1;
    for(ch='B';ch<='Z';ch++)
    {
      one=false;
      tmp=cur;
      cur=pre;
      pre=tmp;
      
      for(i=0;i<W;i++)
      for(j=0;j<L;j++)
      {
        cur[i][j]=false;
      }
      
      for(i=0;i<W;i++)
      for(j=0;j<L;j++)
      if(g[i][j]==ch)
      {
        for(k=0;k<8;k++)
        {
          x=i+v[k][0];
          y=j+v[k][1];
          if(valid(x,W) && valid(y,L) && pre[x][y])
          {
            one=true;
            cur[i][j]=true;
          }
        }
      }
      if(!one) return cnt;
      cnt++;
    }
    return cnt;
  }
  
  public boolean valid(int x,int W)
  {
    return x>=0 && x<W;
  }
}
